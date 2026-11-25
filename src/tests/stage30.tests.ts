import type { IClock } from '../core/abstractions/IClock';
import type {
  DataStoreHealthProbe,
  DataStoreKey,
  DataStoreMetadata,
  IDataStore,
  MetaRecord,
} from '../core/abstractions/IDataStore';
import { FileStorageType, ContentFileKind } from '../core/domain/content';
import {
  CULTURE_COOKIE_MAX_AGE_SECONDS,
  CULTURE_COOKIE_NAME,
  DEFAULT_LANGUAGE,
} from '../core/domain/i18n';
import { ContentCatalogService } from '../core/services/contentCatalogService';
import { ContentManagementService } from '../core/services/contentManagementService';
import { FileUploadService } from '../core/services/fileUploadService';
import { HomePageService } from '../core/services/homePageService';
import {
  formatLocalizedDate,
  formatLocalizedNumber,
  getLocaleConfig,
  getTranslationCoverageReport,
  resolveTranslation,
} from '../core/services/localizationService';
import { PermissionPolicyService } from '../core/services/permissionPolicyService';
import { SearchNormalizer } from '../core/services/searchNormalizer';
import { SystemClock } from '../infrastructure/clock/SystemClock';
import { envConfig } from '../infrastructure/config/envConfig';
import type { IndexedDbDataStore } from '../infrastructure/data/IndexedDbDataStore';
import { IndexedDbAdminRepository } from '../infrastructure/data/IndexedDbAdminRepository';
import { IndexedDbAuthRepository } from '../infrastructure/data/IndexedDbAuthRepository';
import { IndexedDbContentRepository } from '../infrastructure/data/IndexedDbContentRepository';
import { IndexedDbLayoutRepository } from '../infrastructure/data/IndexedDbLayoutRepository';
import { IndexedDbTaxonomyRepository } from '../infrastructure/data/IndexedDbTaxonomyRepository';
import { IndexedDbViewEventRepository } from '../infrastructure/data/IndexedDbViewEventRepository';
import { STORE_NAMES } from '../infrastructure/data/migrations';
import { DatabaseSeeder } from '../infrastructure/data/seed';
import { ensureStage18LayoutSeededAsync } from '../infrastructure/data/stage18LayoutSeed';
import { AppLogger } from '../infrastructure/logging/AppLogger';
import {
  BrowserCultureCookieStorage,
  type CultureCookieAdapter,
  type CultureFallbackAdapter,
} from '../infrastructure/storage/BrowserCultureCookieStorage';
import { LocalIndexedDbFileStorage } from '../infrastructure/storage/LocalIndexedDbFileStorage';
import { enResources } from '../web/resources/en';
import { faResources } from '../web/resources/fa';
import { getActiveLanguage, setActiveLanguage, t } from '../web/resources/i18n';
import { assert, assertEqual, type UnitTestCase } from './testRunner';

class Stage30Clock implements IClock {
  private readonly iso: string;
  private readonly inner = new SystemClock();

  constructor(iso = '2026-11-24T12:00:00.000Z') {
    this.iso = iso;
  }

  public now(): Date {
    return new Date(this.iso);
  }

  public nowUtcIso(): string {
    return this.iso;
  }

  public nowJalali(): string {
    return this.inner.toJalali(this.now());
  }

  public toJalali(date: Date): string {
    return this.inner.toJalali(date);
  }
}

class MemoryStage30DataStore implements IDataStore {
  private readonly meta = new Map<string, MetaRecord>();
  private readonly tables = new Map<string, Map<string, unknown>>();
  private readonly autoIds = new Map<string, number>();

  private getTable(storeName: string): Map<string, unknown> {
    let table = this.tables.get(storeName);
    if (!table) {
      table = new Map<string, unknown>();
      this.tables.set(storeName, table);
    }
    return table;
  }

  private resolveRecordKey(storeName: string, record: Record<string, unknown>): string {
    switch (storeName) {
      case STORE_NAMES.SITE_SETTINGS:
      case STORE_NAMES.FEATURE_FLAGS:
        return String(record.key);
      case STORE_NAMES.CONTENT_TOPICS:
        return `${record.contentId}|${record.topicId}`;
      case STORE_NAMES.CONTENT_TAGS:
        return `${record.contentId}|${record.tagId}`;
      case STORE_NAMES.CONTENT_PERSONS:
        return `${record.contentId}|${record.personId}`;
      case STORE_NAMES.CONTENT_AGE_GROUPS:
        return `${record.contentId}|${record.ageGroupId}`;
      case STORE_NAMES.STAFF_PERMISSIONS:
        return `${record.userId}|${record.permissionKey}`;
      case STORE_NAMES.STORED_FILES:
        return String(record.storageKey);
      case STORE_NAMES.GAME_AGE_GROUPS:
        return `${record.gameId}|${record.ageGroupId}`;
      case STORE_NAMES.GAME_PACKAGES:
        return String(record.packageFolder);
      default:
        return String(record.id);
    }
  }

  private stringifyKey(key: DataStoreKey): string {
    return Array.isArray(key) ? key.join('|') : String(key);
  }

  public getMetadata(): DataStoreMetadata {
    return {
      databaseName: 'MemoryStage30DB',
      databaseVersion: envConfig.databaseVersion,
      metaStoreName: STORE_NAMES.META,
    };
  }

  public async connect(): Promise<void> {}
  public close(): void {}
  public async getObjectStoreNames(): Promise<string[]> {
    return Object.values(STORE_NAMES);
  }
  public async verifyConnection(): Promise<DataStoreHealthProbe> {
    return {
      connected: true,
      readWriteVerified: true,
      latencyMs: 1,
      metadata: this.getMetadata(),
    };
  }
  public async getMeta(key: string): Promise<MetaRecord | null> {
    return this.meta.get(key) ?? null;
  }
  public async setMeta(record: MetaRecord): Promise<void> {
    this.meta.set(record.key, { ...record });
  }
  public async deleteMeta(key: string): Promise<void> {
    this.meta.delete(key);
  }
  public async getAll<T>(storeName: string): Promise<T[]> {
    return Array.from(this.getTable(storeName).values()) as T[];
  }
  public async getByKey<T>(storeName: string, key: DataStoreKey): Promise<T | null> {
    return (this.getTable(storeName).get(this.stringifyKey(key)) as T) ?? null;
  }
  public async getByIndex<T>(
    storeName: string,
    indexName: string,
    indexValue: DataStoreKey,
  ): Promise<T | null> {
    const all = await this.getAllByIndex<T>(storeName, indexName, indexValue);
    return all[0] ?? null;
  }
  public async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    indexValue: DataStoreKey,
  ): Promise<T[]> {
    const field = indexName.startsWith('by_') ? indexName.slice(3) : indexName;
    const rows = await this.getAll<Record<string, unknown>>(storeName);
    return rows.filter((row) => row[field] === indexValue) as unknown as T[];
  }
  public async putRecord<T>(storeName: string, record: T): Promise<void> {
    const rec = record as Record<string, unknown>;
    const keyStr = this.resolveRecordKey(storeName, rec);
    if (typeof rec.id === 'number' && Number.isInteger(rec.id)) {
      const prevAuto = this.autoIds.get(storeName) ?? 0;
      if (rec.id > prevAuto) {
        this.autoIds.set(storeName, rec.id);
      }
    }
    this.getTable(storeName).set(keyStr, record);
  }
  public async putIfAbsent<T>(
    storeName: string,
    key: DataStoreKey,
    record: T,
  ): Promise<boolean> {
    const keyStr = this.stringifyKey(key);
    const table = this.getTable(storeName);
    if (table.has(keyStr)) {
      return false;
    }
    await this.putRecord(storeName, record);
    return true;
  }
  public async updateAllAndPut<T>(
    storeName: string,
    transformExisting: (record: T) => T | null,
    upsertRecord: T,
  ): Promise<void> {
    const existing = await this.getAll<T>(storeName);
    for (const row of existing) {
      const modified = transformExisting(row);
      if (modified !== null) {
        await this.putRecord(storeName, modified);
      }
    }
    await this.putRecord(storeName, upsertRecord);
  }
  public async addRecordWithAutoId<T>(storeName: string, record: T): Promise<number> {
    const next = (this.autoIds.get(storeName) ?? 0) + 1;
    this.autoIds.set(storeName, next);
    const payload = { ...(record as Record<string, unknown>), id: next };
    this.getTable(storeName).set(String(next), payload);
    return next;
  }
  public async deleteByKey(storeName: string, key: DataStoreKey): Promise<void> {
    this.getTable(storeName).delete(this.stringifyKey(key));
  }
  public async count(storeName: string): Promise<number> {
    return this.getTable(storeName).size;
  }
  public async clearStore(storeName: string): Promise<void> {
    this.getTable(storeName).clear();
  }
  public async resetDatabase(): Promise<void> {
    this.meta.clear();
    this.tables.clear();
    this.autoIds.clear();
  }
}

async function createStage30Harness() {
  const store = new MemoryStage30DataStore();
  const dataStore = store as unknown as IndexedDbDataStore;
  const clock = new Stage30Clock();
  const logger = new AppLogger(clock, 'stage30_test_logs', 100);
  const seeder = new DatabaseSeeder(dataStore, logger);
  await seeder.seed('seed');
  await ensureStage18LayoutSeededAsync(dataStore);

  const authRepo = new IndexedDbAuthRepository(dataStore);
  const adminRepo = new IndexedDbAdminRepository(dataStore);
  const taxonomyRepo = new IndexedDbTaxonomyRepository(dataStore);
  const contentRepo = new IndexedDbContentRepository(dataStore);
  const layoutRepo = new IndexedDbLayoutRepository(dataStore);
  const viewRepo = new IndexedDbViewEventRepository(dataStore);
  const searchNormalizer = new SearchNormalizer();
  const permissionPolicy = new PermissionPolicyService(adminRepo, logger);
  const fileStorage = new LocalIndexedDbFileStorage(dataStore, clock);
  const fileUploadService = new FileUploadService(
    fileStorage,
    adminRepo,
    permissionPolicy,
    logger,
  );
  const contentManagementService = new ContentManagementService(
    contentRepo,
    taxonomyRepo,
    permissionPolicy,
    fileUploadService,
    searchNormalizer,
    clock,
    logger,
  );
  const contentCatalogService = new ContentCatalogService(
    contentRepo,
    taxonomyRepo,
    adminRepo,
    searchNormalizer,
  );
  const homePageService = new HomePageService({
    layoutRepository: layoutRepo,
    contentRepository: contentRepo,
    taxonomyRepository: taxonomyRepo,
    adminRepository: adminRepo,
    viewEventRepository: viewRepo,
    clock,
  });

  const superAdmin = await authRepo.createUser({
    email: 'stage30-admin@example.com',
    normalizedEmail: 'stage30-admin@example.com',
    phoneNumber: null,
    normalizedPhoneNumber: null,
    phoneNumberConfirmed: false,
    displayName: 'Stage30 Test Admin',
    passwordHash: 'hash',
    passwordSalt: 'salt',
    role: 'SuperAdmin',
    ageGroupId: null,
    personalizationEnabled: true,
    isActive: true,
    emailConfirmed: true,
    mustChangePassword: false,
    failedLoginCount: 0,
    lockoutEnd: null,
    createdAt: clock.nowUtcIso(),
    lastLoginAt: null,
  });

  const topics = await taxonomyRepo.getAllTopics();
  assert(topics.length > 0, 'Seeded topics must exist');

  return {
    store,
    clock,
    superAdmin,
    rootTopicId: topics[0].id,
    contentManagementService,
    contentCatalogService,
    homePageService,
  };
}

export const stage30Tests: UnitTestCase[] = [
  {
    id: 'stage30.switchToEnglishLocale',
    nameKey: 'tests.stage30.switchToEnglishLocale.name',
    descriptionKey: 'tests.stage30.switchToEnglishLocale.desc',
    run: async () => {
      assert(
        envConfig.databaseVersion >= 21,
        'envConfig.databaseVersion must be >= 21',
      );
      const enConfig = getLocaleConfig('en');
      assertEqual(enConfig.dir, 'ltr', 'English locale dir must be ltr');
      assertEqual(
        enConfig.calendar,
        'gregorian',
        'English locale calendar must be gregorian',
      );
      assertEqual(
        enConfig.usePersianDigits,
        false,
        'English locale must not use Persian digits',
      );
      assertEqual(
        enConfig.fontFamilyKind,
        'system',
        'English locale must use local system font stack',
      );

      const previousLang = getActiveLanguage();
      try {
        setActiveLanguage('en');
        assertEqual(
          t('app.name'),
          enResources['app.name'],
          'app.name must translate to English',
        );
        assertEqual(
          t('layout.nav.home'),
          'Home',
          'layout.nav.home must translate to Home',
        );
        assertEqual(
          t('layout.nav.contentBank'),
          'Content Bank',
          'layout.nav.contentBank must translate to Content Bank',
        );
        assertEqual(
          t('catalog.filters.title'),
          'Filters',
          'catalog.filters.title must translate to Filters',
        );
        assertEqual(
          formatLocalizedNumber('۱۴۰۵', 'en'),
          '1405',
          'English localized number formatting must output Latin digits',
        );
        assertEqual(
          formatLocalizedDate('2026-11-24T12:00:00.000Z', 'en'),
          '2026/11/24',
          'English localized date must use Gregorian YYYY/MM/DD',
        );
      } finally {
        setActiveLanguage(previousLang);
      }
    },
  },
  {
    id: 'stage30.untranslatedFallbackToPersian',
    nameKey: 'tests.stage30.untranslatedFallbackToPersian.name',
    descriptionKey: 'tests.stage30.untranslatedFallbackToPersian.desc',
    run: async () => {
      const untranslatedKey = 'health.card.logs.title';
      assertEqual(
        enResources[untranslatedKey],
        undefined,
        'health.card.logs.title must be intentionally omitted in enResources',
      );

      const resolvedFallback = resolveTranslation(untranslatedKey, 'en', {
        fa: faResources,
        en: enResources,
      });
      assertEqual(
        resolvedFallback,
        faResources[untranslatedKey],
        'Untranslated key in English must fall back safely to Persian faResources',
      );

      const emptyEnFallback = resolveTranslation('app.name', 'en', {
        fa: faResources,
        en: { 'app.name': '   ' },
      });
      assertEqual(
        emptyEnFallback,
        faResources['app.name'],
        'Whitespace-only English entry must fall back to Persian',
      );

      const unknownKey = 'stage30.unknown.missing.key';
      assertEqual(
        resolveTranslation(unknownKey, 'en', {
          fa: faResources,
          en: enResources,
        }),
        unknownKey,
        'Unknown resource key must safely return the key itself',
      );
    },
  },
  {
    id: 'stage30.persianLocalePreservation',
    nameKey: 'tests.stage30.persianLocalePreservation.name',
    descriptionKey: 'tests.stage30.persianLocalePreservation.desc',
    run: async () => {
      assert(
        envConfig.databaseVersion >= 21,
        'envConfig.databaseVersion must remain >= 21',
      );
      assert(envConfig.stageNumber >= 30, 'envConfig.stageNumber must be >= 30');

      const faConfig = getLocaleConfig('fa');
      assertEqual(faConfig.dir, 'rtl', 'Persian locale dir must be rtl');
      assertEqual(faConfig.calendar, 'jalali', 'Persian locale calendar must be jalali');
      assertEqual(
        faConfig.usePersianDigits,
        true,
        'Persian locale must preserve Persian digits',
      );
      assertEqual(
        faConfig.fontFamilyKind,
        'vazirmatn',
        'Persian locale must preserve Vazirmatn font',
      );

      assertEqual(
        formatLocalizedNumber(12345, 'fa'),
        '۱۲۳۴۵',
        'Persian number formatting must convert 12345 -> ۱۲۳۴۵',
      );

      const jalaliDate = formatLocalizedDate('2026-11-24T12:00:00.000Z', 'fa');
      assert(
        /[۰-۹]/.test(jalaliDate) && jalaliDate.includes('۱۴۰۵'),
        `Persian date must be Jalali with Persian digits, got ${jalaliDate}`,
      );

      assertEqual(
        resolveTranslation('app.name', 'fa', {
          fa: faResources,
          en: enResources,
        }),
        'معراج اندیشه',
        'Persian resource lookup must remain untouched',
      );
      assertEqual(
        DEFAULT_LANGUAGE,
        'fa',
        'Default language must remain fa',
      );
    },
  },
  {
    id: 'stage30.searchDigitNormalizationAcrossLocales',
    nameKey: 'tests.stage30.searchDigitNormalizationAcrossLocales.name',
    descriptionKey: 'tests.stage30.searchDigitNormalizationAcrossLocales.desc',
    run: async () => {
      const harness = await createStage30Harness();
      try {
        const draftRes = await harness.contentManagementService.saveDraft(
          harness.superAdmin,
          {
            title: 'گزارش علمی سال ۱۴۰۵ شماره 204',
            summary: 'بررسی دستاوردهای علمی ۱۴۰۵ و آزمایش 204',
            body: '<p>متن کامل گزارش علمی سال ۱۴۰۵ برای آزمون جستجوی دوگانه ارقام.</p>',
            format: 'Article',
            isFeatured: false,
            languageCode: 'fa',
            thumbnailKey: 'thumb-stage30-search.png',
            sources: [{ title: 'منبع آزمایشی جستجو' }],
            files: [],
            topicIds: [harness.rootTopicId],
            tagIds: [],
            personIds: [],
            ageGroupIds: [],
          },
        );
        assert(draftRes.ok && draftRes.data, 'Draft save must succeed');
        const pubRes = await harness.contentManagementService.publishContent(
          harness.superAdmin,
          draftRes.data.item.id,
        );
        assert(pubRes.ok, 'Publish must succeed');

        const faPersianDigitRes = await harness.contentCatalogService.queryCatalogAsync({
          query: '۱۴۰۵',
          activeAgeGroup: null,
          language: 'fa',
        });
        const faLatinDigitRes = await harness.contentCatalogService.queryCatalogAsync({
          query: '1405',
          activeAgeGroup: null,
          language: 'fa',
        });
        const enPersianDigitRes = await harness.contentCatalogService.queryCatalogAsync({
          query: '۱۴۰۵',
          activeAgeGroup: null,
          language: 'en',
        });
        const enLatinDigitRes = await harness.contentCatalogService.queryCatalogAsync({
          query: '1405',
          activeAgeGroup: null,
          language: 'en',
        });

        assertEqual(
          faPersianDigitRes.result.totalCount,
          1,
          'Persian digit query in fa must find 1 matching item',
        );
        assertEqual(
          faLatinDigitRes.result.totalCount,
          1,
          'Latin digit query in fa must find identical 1 matching item',
        );
        assertEqual(
          enPersianDigitRes.result.totalCount,
          1,
          'Persian digit query in en must find identical 1 matching item',
        );
        assertEqual(
          enLatinDigitRes.result.totalCount,
          1,
          'Latin digit query in en must find identical 1 matching item',
        );
        assertEqual(
          faPersianDigitRes.result.items[0].item.id,
          enLatinDigitRes.result.items[0].item.id,
          'Matched item ID must be identical across fa/en and Persian/Latin digits',
        );
      } finally {
        await harness.store.resetDatabase();
      }
    },
  },
  {
    id: 'stage30.contentLanguageFilterFallbackAndCookie',
    nameKey: 'tests.stage30.contentLanguageFilterFallbackAndCookie.name',
    descriptionKey: 'tests.stage30.contentLanguageFilterFallbackAndCookie.desc',
    run: async () => {
      const harness = await createStage30Harness();
      try {
        // 1. Create and publish Persian-only content first
        const faDraft = await harness.contentManagementService.saveDraft(
          harness.superAdmin,
          {
            title: 'مقاله فارسی نمونه مرحله ۳۰',
            summary: 'خلاصه مقاله فارسی برای آزمون بازگشت خودکار زبان',
            body: '<p>متن کامل مقاله فارسی برای نمایش در زمان نبود محتوای انگلیسی.</p>',
            format: 'Article',
            isFeatured: true,
            languageCode: 'fa',
            thumbnailKey: 'thumb-fa-30.png',
            sources: [{ title: 'منبع فارسی' }],
            files: [],
            topicIds: [harness.rootTopicId],
            tagIds: [],
            personIds: [],
            ageGroupIds: [],
          },
        );
        assert(faDraft.ok && faDraft.data, 'Persian draft must save');
        await harness.contentManagementService.publishContent(
          harness.superAdmin,
          faDraft.data.item.id,
        );

        // When no English content exists, language='en' must fall back safely to Persian items
        const fallbackCatalog = await harness.contentCatalogService.queryCatalogAsync({
          activeAgeGroup: null,
          language: 'en',
        });
        assertEqual(
          fallbackCatalog.result.totalCount,
          1,
          'Catalog in en mode without en content must fall back to Persian content',
        );
        assertEqual(
          fallbackCatalog.result.items[0].item.languageCode,
          'fa',
          'Fallback catalog item must be fa',
        );

        const fallbackHome = await harness.homePageService.getHomePageDataAsync(null, {
          language: 'en',
        });
        assert(
          fallbackHome.shelves.some((s) =>
            s.items.some((entry) => entry.item.id === faDraft.data!.item.id),
          ),
          'HomePageService in en mode without en content must fall back to Persian content',
        );

        // 2. Publish an English content item
        const enDraft = await harness.contentManagementService.saveDraft(
          harness.superAdmin,
          {
            title: 'English Astronomy Guide Stage 30',
            summary: 'Curated English educational article for multilingual filter test.',
            body: '<p>Full English educational article body for Stage 30 verification.</p>',
            format: 'Article',
            isFeatured: true,
            languageCode: 'en',
            thumbnailKey: 'thumb-en-30.png',
            sources: [{ title: 'Verified English Reference' }],
            files: [],
            topicIds: [harness.rootTopicId],
            tagIds: [],
            personIds: [],
            ageGroupIds: [],
          },
        );
        assert(enDraft.ok && enDraft.data, 'English draft must save');
        assertEqual(
          enDraft.data.item.languageCode,
          'en',
          'Saved English item must persist languageCode = en',
        );
        await harness.contentManagementService.publishContent(
          harness.superAdmin,
          enDraft.data.item.id,
        );

        const enCatalog = await harness.contentCatalogService.queryCatalogAsync({
          activeAgeGroup: null,
          language: 'en',
        });
        assertEqual(
          enCatalog.result.totalCount,
          1,
          'Catalog in en mode with published en content must filter to en items',
        );
        assertEqual(
          enCatalog.result.items[0].item.id,
          enDraft.data.item.id,
          'Catalog in en mode must return the English item',
        );

        const faCatalog = await harness.contentCatalogService.queryCatalogAsync({
          activeAgeGroup: null,
          language: 'fa',
        });
        assertEqual(
          faCatalog.result.totalCount,
          1,
          'Catalog in fa mode must filter to fa items',
        );
        assertEqual(
          faCatalog.result.items[0].item.id,
          faDraft.data.item.id,
          'Catalog in fa mode must return the Persian item',
        );

        const enHome = await harness.homePageService.getHomePageDataAsync(null, {
          language: 'en',
        });
        const enHomeItemIds = enHome.shelves.flatMap((s) => s.items.map((x) => x.item.id));
        assert(
          enHomeItemIds.includes(enDraft.data.item.id) &&
            !enHomeItemIds.includes(faDraft.data.item.id),
          'HomePageService in en mode must show English content when available',
        );

        // 3. Test BrowserCultureCookieStorage (`ma_lang`)
        let mockCookieJar = '';
        const mockFallbackMap = new Map<string, string>();
        const cookieAdapter: CultureCookieAdapter = {
          getCookieString: () => mockCookieJar,
          setCookieString: (assignment: string) => {
            if (assignment.includes('max-age=0')) {
              mockCookieJar = '';
            } else {
              const pair = assignment.split(';')[0] ?? '';
              mockCookieJar = pair;
            }
          },
        };
        const fallbackAdapter: CultureFallbackAdapter = {
          getItem: (k) => mockFallbackMap.get(k) ?? null,
          setItem: (k, v) => {
            mockFallbackMap.set(k, v);
          },
          removeItem: (k) => {
            mockFallbackMap.delete(k);
          },
        };
        const storage = new BrowserCultureCookieStorage({
          cookieAdapter,
          fallbackAdapter,
        });
        assertEqual(storage.getLanguage(), null, 'Initial culture storage must be null');
        storage.setLanguage('en', CULTURE_COOKIE_MAX_AGE_SECONDS);
        assertEqual(
          mockCookieJar,
          `${CULTURE_COOKIE_NAME}=en`,
          'Culture storage must write ma_lang=en cookie',
        );
        assertEqual(storage.getLanguage(), 'en', 'Culture storage must read en');
        storage.clearLanguage();
        assertEqual(storage.getLanguage(), null, 'Cleared culture storage must return null');

        // 4. Test translation coverage report
        const coverage = getTranslationCoverageReport({
          fa: faResources,
          en: enResources,
        });
        assertEqual(
          coverage.totalKeysCount,
          Object.keys(faResources).length,
          'Total keys must equal faResources count',
        );
        assert(
          coverage.translatedKeysCount > 0 && coverage.untranslatedKeysCount > 0,
          'Partial experimental en.ts must report both translated and untranslated keys',
        );
        assertEqual(
          coverage.translatedKeysCount + coverage.untranslatedKeysCount,
          coverage.totalKeysCount,
          'Translated + untranslated counts must equal total keys',
        );
        assertEqual(
          coverage.untranslatedKeys.length,
          coverage.untranslatedKeysCount,
          'Untranslated keys list length must match untranslated count',
        );
      } finally {
        await harness.store.resetDatabase();
      }
    },
  },
];
