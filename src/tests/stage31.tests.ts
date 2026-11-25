import type { IClock } from '../core/abstractions/IClock';
import type { IAdminRepository } from '../core/abstractions/adminRepository';
import type {
  DataStoreHealthProbe,
  DataStoreKey,
  DataStoreMetadata,
  IDataStore,
  MetaRecord,
} from '../core/abstractions/IDataStore';
import type { ITaxonomyRepository } from '../core/abstractions/taxonomyRepository';
import type { AppUser, UserRole } from '../core/domain/auth';
import type { ContentItem, ContentTopic } from '../core/domain/content';
import type { PermissionKey, StaffPermission } from '../core/domain/permissions';
import type { FeatureFlag, SiteSetting } from '../core/domain/settings';
import type {
  AgeGroup,
  ImpactLevel,
  Person,
  Tag,
  Topic,
} from '../core/domain/taxonomy';
import { GamePortalService } from '../core/services/gamePortalService';
import { PermissionPolicyService } from '../core/services/permissionPolicyService';
import { StudioExclusiveGameService } from '../core/services/studioExclusiveGameService';
import { SystemClock } from '../infrastructure/clock/SystemClock';
import { envConfig } from '../infrastructure/config/envConfig';
import { IndexedDbDataStore } from '../infrastructure/data/IndexedDbDataStore';
import { IndexedDbGameRepository } from '../infrastructure/data/IndexedDbGameRepository';
import { STORE_NAMES } from '../infrastructure/data/migrations';
import { StudioExclusiveGameCatalog } from '../infrastructure/games/studioExclusiveGames/StudioExclusiveGameCatalog';
import { AppLogger } from '../infrastructure/logging/AppLogger';
import {
  buildSandboxedSrcdocFromPackage,
  Html5GamePackageService,
} from '../infrastructure/storage/html5GamePackageService';
import { assert, assertEqual, type UnitTestCase } from './testRunner';

class Stage31FakeClock implements IClock {
  private iso: string;
  private readonly inner = new SystemClock();

  constructor(initialIso = '2026-11-25T10:00:00.000Z') {
    this.iso = initialIso;
  }

  public advanceMs(deltaMs: number): void {
    this.iso = new Date(Date.parse(this.iso) + deltaMs).toISOString();
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

class MemoryStage31DataStore implements IDataStore {
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

  private resolveKeyPath(storeName: string): string {
    switch (storeName) {
      case STORE_NAMES.GAME_PACKAGES:
        return 'packageFolder';
      case STORE_NAMES.SITE_SETTINGS:
      case STORE_NAMES.FEATURE_FLAGS:
        return 'key';
      default:
        return 'id';
    }
  }

  private stringifyKey(key: DataStoreKey): string {
    return Array.isArray(key) ? key.join('|') : String(key);
  }

  public getMetadata(): DataStoreMetadata {
    return {
      databaseName: 'MemoryStage31DB',
      databaseVersion: envConfig.databaseVersion,
      metaStoreName: STORE_NAMES.META,
    };
  }

  public async connect(): Promise<void> {}
  public close(): void {}
  public async getObjectStoreNames(): Promise<string[]> {
    return [
      STORE_NAMES.META,
      STORE_NAMES.GAMES,
      STORE_NAMES.GAME_AGE_GROUPS,
      STORE_NAMES.GAME_SCORES,
      STORE_NAMES.GAME_PACKAGES,
      STORE_NAMES.FEATURE_FLAGS,
      STORE_NAMES.SITE_SETTINGS,
    ];
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
  public async getByKey<T>(
    storeName: string,
    key: DataStoreKey,
  ): Promise<T | null> {
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
    let keyStr: string;
    if (storeName === STORE_NAMES.GAME_AGE_GROUPS) {
      keyStr = `${rec.gameId}|${rec.ageGroupId}`;
    } else {
      const kp = this.resolveKeyPath(storeName);
      keyStr = String(rec[kp]);
    }
    this.getTable(storeName).set(keyStr, record);
  }
  public async addRecordWithAutoId<T>(
    storeName: string,
    record: T,
  ): Promise<number> {
    const next = (this.autoIds.get(storeName) ?? 0) + 1;
    this.autoIds.set(storeName, next);
    const payload = { ...(record as Record<string, unknown>), id: next };
    this.getTable(storeName).set(String(next), payload);
    return next;
  }
  public async deleteByKey(
    storeName: string,
    key: DataStoreKey,
  ): Promise<void> {
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

class MemoryStage31AdminRepo implements IAdminRepository {
  private readonly users = new Map<number, AppUser>();
  private readonly perms = new Map<number, PermissionKey[]>();
  private readonly flags = new Map<string, FeatureFlag>();
  private readonly settings = new Map<string, SiteSetting>();
  private readonly ageGroups: AgeGroup[] = [
    {
      id: 1,
      key: 'child',
      name: 'کودک',
      minAge: 6,
      maxAge: 11,
      themeKey: 'playful',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 2,
      key: 'teen',
      name: 'نوجوان',
      minAge: 12,
      maxAge: 17,
      themeKey: 'playful',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 3,
      key: 'youth',
      name: 'جوان',
      minAge: 18,
      maxAge: 29,
      themeKey: 'modern',
      sortOrder: 3,
      isActive: true,
    },
    {
      id: 4,
      key: 'adult',
      name: 'بزرگسال',
      minAge: 30,
      maxAge: null,
      themeKey: 'editorial',
      sortOrder: 4,
      isActive: true,
    },
  ];
  private nextUserId = 1;

  constructor() {
    this.flags.set('Games', {
      key: 'Games',
      isEnabled: true,
    });
    this.settings.set('Upload.MaxOtherMb', {
      key: 'Upload.MaxOtherMb',
      value: '25',
    });
  }

  public addUser(
    role: UserRole,
    permissions: PermissionKey[] = [],
    overrides?: Partial<AppUser>,
  ): AppUser {
    const id = this.nextUserId++;
    const user: AppUser = {
      id,
      email: `stage31-user${id}@meraj.local`,
      normalizedEmail: `STAGE31-USER${id}@MERAJ.LOCAL`,
      emailConfirmed: true,
      phoneNumber: null,
      normalizedPhoneNumber: null,
      phoneNumberConfirmed: false,
      passwordHash: null,
      passwordSalt: null,
      displayName: `بازیکن ${id}`,
      role,
      ageGroupId: null,
      personalizationEnabled: true,
      isActive: true,
      isDeleted: false,
      mustChangePassword: false,
      failedLoginCount: 0,
      lockoutEnd: null,
      lastLoginAt: null,
      createdAt: '2026-11-25T09:00:00.000Z',
      ...overrides,
    };
    this.users.set(id, user);
    this.perms.set(id, permissions);
    return user;
  }

  public getAgeGroupsList(): AgeGroup[] {
    return this.ageGroups;
  }

  public async getAllUsers(): Promise<AppUser[]> {
    return Array.from(this.users.values());
  }
  public async getUserById(id: number): Promise<AppUser | null> {
    return this.users.get(id) ?? null;
  }
  public async getUserByNormalizedEmail(norm: string): Promise<AppUser | null> {
    return (
      Array.from(this.users.values()).find((u) => u.normalizedEmail === norm) ??
      null
    );
  }
  public async getUserByNormalizedPhoneNumber(
    norm: string,
  ): Promise<AppUser | null> {
    return (
      Array.from(this.users.values()).find(
        (u) => u.normalizedPhoneNumber === norm,
      ) ?? null
    );
  }
  public async createUser(): Promise<AppUser> {
    throw new Error('Not needed');
  }
  public async updateUser(user: AppUser): Promise<void> {
    this.users.set(user.id, user);
  }
  public async deleteSessionsByUserId(): Promise<void> {}
  public async getStaffPermissionsByUserId(
    userId: number,
  ): Promise<StaffPermission[]> {
    const keys = this.perms.get(userId) ?? [];
    return keys.map((permissionKey, idx) => ({
      id: idx + 1,
      userId,
      permissionKey,
      grantedAt: '2026-11-25T09:00:00.000Z',
      grantedById: null,
    }));
  }
  public async replaceStaffPermissions(): Promise<StaffPermission[]> {
    return [];
  }
  public async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }
  public async upsertFeatureFlag(flag: FeatureFlag): Promise<void> {
    this.flags.set(flag.key, flag);
  }
  public async getAllSiteSettings(): Promise<SiteSetting[]> {
    return Array.from(this.settings.values());
  }
  public async getSiteSettingByKey(key: string): Promise<SiteSetting | null> {
    return this.settings.get(key) ?? null;
  }
  public async upsertSiteSettings(items: SiteSetting[]): Promise<void> {
    for (const item of items) {
      this.settings.set(item.key, item);
    }
  }
  public async getActiveAgeGroups(): Promise<AgeGroup[]> {
    return this.ageGroups.filter((ag) => ag.isActive);
  }
}

class MemoryStage31TaxonomyRepo implements ITaxonomyRepository {
  private readonly topics: Topic[] = [
    {
      id: 1,
      parentId: null,
      name: 'تاریخ',
      slug: 'تاریخ',
      icon: null,
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 2,
      parentId: null,
      name: 'سواد رسانه‌ای',
      slug: 'سواد-رسانه-ای',
      icon: null,
      sortOrder: 2,
      isActive: true,
    },
  ];
  private readonly ageGroups: AgeGroup[];

  constructor(ageGroups: AgeGroup[]) {
    this.ageGroups = ageGroups;
  }

  public async getAllTopics(): Promise<Topic[]> {
    return this.topics;
  }
  public async getTopicById(id: number): Promise<Topic | null> {
    return this.topics.find((t) => t.id === id) ?? null;
  }
  public async createTopic(): Promise<Topic> {
    throw new Error('Not needed');
  }
  public async updateTopic(): Promise<void> {}
  public async deleteTopic(): Promise<void> {}
  public async getAllTags(): Promise<Tag[]> {
    return [];
  }
  public async getTagById(): Promise<Tag | null> {
    return null;
  }
  public async createTag(): Promise<Tag> {
    throw new Error('Not needed');
  }
  public async updateTag(): Promise<void> {}
  public async deleteTag(): Promise<void> {}
  public async getAllPersons(): Promise<Person[]> {
    return [];
  }
  public async getPersonById(): Promise<Person | null> {
    return null;
  }
  public async createPerson(): Promise<Person> {
    throw new Error('Not needed');
  }
  public async updatePerson(): Promise<void> {}
  public async deletePerson(): Promise<void> {}
  public async getAllImpactLevels(): Promise<ImpactLevel[]> {
    return [];
  }
  public async getImpactLevelById(): Promise<ImpactLevel | null> {
    return null;
  }
  public async createImpactLevel(): Promise<ImpactLevel> {
    throw new Error('Not needed');
  }
  public async updateImpactLevel(): Promise<void> {}
  public async deleteImpactLevel(): Promise<void> {}
  public async getAllAgeGroups(): Promise<AgeGroup[]> {
    return this.ageGroups;
  }
  public async getAgeGroupById(id: number): Promise<AgeGroup | null> {
    return this.ageGroups.find((ag) => ag.id === id) ?? null;
  }
  public async updateAgeGroup(): Promise<void> {}
  public async getContentTopicLinks(): Promise<ContentTopic[]> {
    return [];
  }
  public async countContentTagsByTagId(): Promise<number> {
    return 0;
  }
  public async countContentPersonsByPersonId(): Promise<number> {
    return 0;
  }
  public async countContentItemsByImpactLevelId(): Promise<number> {
    return 0;
  }
  public async createContentItem(): Promise<ContentItem> {
    throw new Error('Not needed');
  }
  public async linkContentTopic(): Promise<void> {}
}

function createStage31Harness() {
  const clock = new Stage31FakeClock('2026-11-25T10:00:00.000Z');
  const logKey = `meraj_stage31_logs_${Date.now()}_${Math.random()}`;
  const logger = new AppLogger(clock, logKey, 200);
  const dataStore = new MemoryStage31DataStore();
  const adminRepo = new MemoryStage31AdminRepo();
  const taxonomyRepo = new MemoryStage31TaxonomyRepo(adminRepo.getAgeGroupsList());
  const gameRepo = new IndexedDbGameRepository(
    dataStore as unknown as IndexedDbDataStore,
  );
  const packageStorage = new Html5GamePackageService(
    dataStore as unknown as IndexedDbDataStore,
  );
  const policyService = new PermissionPolicyService(adminRepo, logger);
  const catalog = new StudioExclusiveGameCatalog();

  const gamePortalService = new GamePortalService({
    gameRepository: gameRepo,
    packageStorage,
    taxonomyRepository: taxonomyRepo,
    adminRepository: adminRepo,
    policyService,
    clock,
    logger,
    deletedDisplayName: 'کاربر حذف‌شده',
  });

  const studioExclusiveGameService = new StudioExclusiveGameService({
    catalog,
    gameRepository: gameRepo,
    packageStorage,
    taxonomyRepository: taxonomyRepo,
    adminRepository: adminRepo,
    policyService,
    clock,
    logger,
  });

  const staffWithPortals = adminRepo.addUser('Staff', ['portals.manage'], {
    displayName: 'مدیر پرتال',
  });
  const staffWithoutPortals = adminRepo.addUser('Staff', ['content.manage'], {
    displayName: 'پشتیبان محتوا',
  });
  const member = adminRepo.addUser('Member', [], {
    displayName: 'مهدی',
  });
  const secondMember = adminRepo.addUser('Member', [], {
    displayName: 'سارا',
  });

  return {
    clock,
    logger,
    dataStore,
    adminRepo,
    taxonomyRepo,
    gameRepo,
    packageStorage,
    catalog,
    gamePortalService,
    studioExclusiveGameService,
    staffWithPortals,
    staffWithoutPortals,
    member,
    secondMember,
    cleanup: () => logger.clearLogs(),
  };
}

export const stage31Tests: UnitTestCase[] = [
  {
    id: 'stage31-blueprints-design-doc-complete',
    nameKey: 'tests.stage31.blueprintsDesignDocComplete.name',
    descriptionKey: 'tests.stage31.blueprintsDesignDocComplete.desc',
    run: async () => {
      const h = createStage31Harness();
      try {
        const blueprints =
          await h.studioExclusiveGameService.listStudioExclusiveBlueprints();
        assert(
          blueprints.length >= 2,
          'Studio exclusive catalog must include at least 2 blueprints',
        );

        const codes = new Set(blueprints.map((bp) => bp.code));
        assert(
          codes.has('media-literacy-detective'),
          'Catalog must contain Game 1 (media-literacy-detective)',
        );
        assert(
          codes.has('history-timeline-challenge'),
          'Catalog must contain Game 2 (history-timeline-challenge)',
        );

        for (const bp of blueprints) {
          assert(
            bp.title.trim().length > 0,
            `Blueprint ${bp.code} must have a non-empty title`,
          );
          assert(
            bp.educationalGoal.trim().length >= 10,
            `Blueprint ${bp.code} must have complete educationalGoal`,
          );
          assert(
            bp.targetAgeLabel.trim().length > 0 && bp.targetAgeKeys.length > 0,
            `Blueprint ${bp.code} must specify targetAgeLabel and targetAgeKeys`,
          );
          assert(
            bp.scoringRules.trim().length > 0,
            `Blueprint ${bp.code} must specify scoringRules`,
          );
          assert(
            bp.endMessage.trim().length > 0,
            `Blueprint ${bp.code} must specify educational endMessage`,
          );
          assert(
            Number.isInteger(bp.maxScore) && bp.maxScore > 0,
            `Blueprint ${bp.code} must define positive integer maxScore`,
          );

          const zipRes =
            await h.studioExclusiveGameService.buildExclusiveGameZipAsync(bp.code);
          assertEqual(
            zipRes.ok,
            true,
            `Standard .zip package for ${bp.code} must build & pass validation`,
          );
          assert(
            zipRes.bytes !== undefined && zipRes.bytes.length > 100,
            `ZIP bytes for ${bp.code} must be non-empty`,
          );

          const extracted = await h.packageStorage.validateAndExtractZipAsync({
            fileName: zipRes.zipFileName ?? `${bp.code}.zip`,
            bytes: zipRes.bytes!,
            maxTotalBytes: 25 * 1024 * 1024,
          });
          assertEqual(
            extracted.ok,
            true,
            `Extracted ZIP for ${bp.code} must pass security validation`,
          );
          const combinedContent = extracted.entries
            .map((e) => e.textContent ?? '')
            .join('\n');
          assert(
            !combinedContent.includes('https://') &&
              !combinedContent.includes('http://'),
            `Exclusive game ${bp.code} must NOT reference any external CDN URLs`,
          );
          assert(
            combinedContent.includes('MERAJ_GAME_SCORE'),
            `Exclusive game ${bp.code} must emit MERAJ_GAME_SCORE postMessage`,
          );
        }
      } finally {
        h.cleanup();
      }
    },
  },
  {
    id: 'stage31-install-and-publish-zip-no-duplicate',
    nameKey: 'tests.stage31.installAndPublishZipNoDuplicate.name',
    descriptionKey: 'tests.stage31.installAndPublishZipNoDuplicate.desc',
    run: async () => {
      const h = createStage31Harness();
      try {
        const firstInstall =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.staffWithPortals,
            'media-literacy-detective',
          );
        assertEqual(
          firstInstall.ok,
          true,
          'First exclusive game install must succeed',
        );
        if (!firstInstall.ok || !firstInstall.data) {
          throw new Error('Expected installed game item');
        }

        const game1 = firstInstall.data;
        assertEqual(
          game1.isStudioExclusive,
          true,
          'Installed exclusive game must carry isStudioExclusive=true',
        );
        assertEqual(
          game1.exclusiveCode,
          'media-literacy-detective',
          'Installed exclusive game must preserve exclusiveCode',
        );
        assertEqual(
          game1.isPublished,
          true,
          'Installed exclusive game must be published immediately',
        );
        assertEqual(game1.topicId, 2, 'Game 1 must auto-link to سواد رسانه‌ای topic');

        const pkg = await h.packageStorage.getPackageAsync(game1.packageFolder);
        assert(pkg !== null, 'Package folder must be persisted in packageStorage');
        assert(
          pkg!.entries.some((e) => e.path === 'index.html') &&
            pkg!.entries.some((e) => e.path === 'manifest.json') &&
            pkg!.entries.some((e) => e.path === 'game.js') &&
            pkg!.entries.some((e) => e.path === 'style.css'),
          'Exclusive package must contain index.html, manifest.json, style.css, and game.js',
        );

        const srcdoc = buildSandboxedSrcdocFromPackage(pkg!);
        assert(
          srcdoc !== null &&
            srcdoc.includes('MERAJ_GAME_SCORE') &&
            srcdoc.includes('کارآگاه خبر و شایعه'),
          'Sandboxed srcdoc must inline CSS/JS cleanly for exclusive game',
        );

        // Re-install same code -> updates existing record in place without creating duplicates
        h.clock.advanceMs(5000);
        const secondInstall =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.staffWithPortals,
            'media-literacy-detective',
          );
        assertEqual(secondInstall.ok, true, 'Re-install/update must succeed');
        assertEqual(
          secondInstall.data?.id,
          game1.id,
          'Re-install must update the existing GameItem ID instead of duplicating',
        );

        const adminList = await h.gamePortalService.listAdminGamesAsync(
          h.staffWithPortals,
        );
        assertEqual(adminList.ok, true, 'Admin list must succeed');
        assertEqual(
          adminList.data?.length,
          1,
          'Exactly 1 Game record must exist after re-install (no duplicates)',
        );
      } finally {
        h.cleanup();
      }
    },
  },
  {
    id: 'stage31-score-leaderboard-and-end-message',
    nameKey: 'tests.stage31.scoreSubmissionLeaderboardAndEndMessage.name',
    descriptionKey: 'tests.stage31.scoreSubmissionLeaderboardAndEndMessage.desc',
    run: async () => {
      const h = createStage31Harness();
      try {
        const installed =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.staffWithPortals,
            'media-literacy-detective',
          );
        if (!installed.ok || !installed.data) {
          throw new Error('Expected game install');
        }
        const game = installed.data;

        const ages = await h.adminRepo.getActiveAgeGroups();
        const childAge = ages.find((ag) => ag.key === 'child')!;

        // Valid score submissions by two members
        const submit1 = await h.gamePortalService.submitGameScoreAsync(h.member, {
          gameId: game.id,
          score: 700,
          activeAgeGroup: childAge,
        });
        assertEqual(submit1.ok, true, 'Valid score 700 <= 800 must succeed');
        assert(
          submit1.data?.endMessage?.includes('کارآگاه') ?? false,
          'Score result must include educational endMessage',
        );
        assertEqual(
          submit1.data?.leaderboard[0]?.score,
          700,
          'Member score must appear at top of leaderboard',
        );
        assertEqual(
          submit1.data?.leaderboard[0]?.userId,
          h.member.id,
          'Leaderboard rank 1 must match member userId',
        );

        h.clock.advanceMs(1000);
        const submit2 = await h.gamePortalService.submitGameScoreAsync(
          h.secondMember,
          {
            gameId: game.id,
            score: 800,
            activeAgeGroup: childAge,
          },
        );
        assertEqual(submit2.ok, true, 'Exact maxScore 800 must succeed');
        assertEqual(
          submit2.data?.leaderboard.length,
          2,
          'Leaderboard must list both members',
        );
        assertEqual(
          submit2.data?.leaderboard[0]?.score,
          800,
          'Higher score 800 must take rank 1',
        );

        // Over-maxScore rejection (801 > 800)
        const invalidOverMax = await h.gamePortalService.submitGameScoreAsync(
          h.member,
          {
            gameId: game.id,
            score: game.maxScore + 1,
            activeAgeGroup: childAge,
          },
        );
        assertEqual(
          invalidOverMax.ok,
          false,
          'Score exceeding exclusive game maxScore must be rejected',
        );
        assertEqual(
          invalidOverMax.statusCode,
          400,
          'Over-max score must return HTTP 400',
        );
        assertEqual(
          invalidOverMax.errorCode,
          'INVALID_GAME_SCORE',
          'Expected INVALID_GAME_SCORE',
        );

        // Public detail returns isStudioExclusive and endMessage
        const detail = await h.gamePortalService.getPublicGameDetailAsync(
          game.slug,
          childAge,
          h.member,
        );
        assertEqual(detail.status, 'ok', 'Detail must open for child');
        if (detail.status === 'ok') {
          assertEqual(
            detail.data.game.isStudioExclusive,
            true,
            'Public detail must expose isStudioExclusive=true',
          );
          assert(
            (detail.data.game.endMessage ?? '').length > 0,
            'Public detail must preserve educational endMessage',
          );
        }
      } finally {
        h.cleanup();
      }
    },
  },
  {
    id: 'stage31-child-safety-on-exclusive-teen-adult',
    nameKey: 'tests.stage31.childSafetyOnExclusiveTeenAdultGame.name',
    descriptionKey: 'tests.stage31.childSafetyOnExclusiveTeenAdultGame.desc',
    run: async () => {
      const h = createStage31Harness();
      try {
        // Install both exclusive games: Game 1 (child+teen), Game 2 (teen+youth+adult)
        await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
          h.staffWithPortals,
          'media-literacy-detective',
        );
        const game2Install =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.staffWithPortals,
            'history-timeline-challenge',
          );
        assertEqual(game2Install.ok, true, 'Game 2 install must succeed');
        const game2 = game2Install.data!;
        assertEqual(game2.topicId, 1, 'Game 2 must auto-link to تاریخ topic');

        const ages = await h.adminRepo.getActiveAgeGroups();
        const childAge = ages.find((ag) => ag.key === 'child')!;
        const teenAge = ages.find((ag) => ag.key === 'teen')!;
        const adultAge = ages.find((ag) => ag.key === 'adult')!;

        // Child sees Game 1 only, NEVER Game 2
        const childPortal = await h.gamePortalService.getGamesPortalDataAsync(
          childAge,
        );
        assertEqual(childPortal.enabled, true, 'Portal enabled');
        if (childPortal.enabled) {
          assert(
            childPortal.data.items.some(
              (item) => item.game.exclusiveCode === 'media-literacy-detective',
            ),
            'Child must see child+teen exclusive Game 1',
          );
          assertEqual(
            childPortal.data.items.some((item) => item.game.id === game2.id),
            false,
            'CRITICAL Child Safety: Child MUST NOT see teen/adult exclusive Game 2 in #/games',
          );
        }

        const childDirectGame2 =
          await h.gamePortalService.getPublicGameDetailAsync(
            game2.slug,
            childAge,
            h.member,
          );
        assertEqual(
          childDirectGame2.status,
          'not_found',
          'CRITICAL Child Safety: Direct #/games/:slug for Game 2 under child age must return not_found (404)',
        );

        // Teen & Adult see Game 2 and can open it
        const teenDetail = await h.gamePortalService.getPublicGameDetailAsync(
          game2.slug,
          teenAge,
          h.member,
        );
        assertEqual(teenDetail.status, 'ok', 'Teen must access Game 2');

        const adultDetail = await h.gamePortalService.getPublicGameDetailAsync(
          game2.slug,
          adultAge,
          h.member,
        );
        assertEqual(adultDetail.status, 'ok', 'Adult must access Game 2');
      } finally {
        h.cleanup();
      }
    },
  },
  {
    id: 'stage31-portals-manage-policy-exclusive-install',
    nameKey: 'tests.stage31.portalsManagePolicyForExclusiveInstall.name',
    descriptionKey: 'tests.stage31.portalsManagePolicyForExclusiveInstall.desc',
    run: async () => {
      const h = createStage31Harness();
      try {
        const guestRes =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            null,
            'media-literacy-detective',
          );
        assertEqual(guestRes.statusCode, 404, 'Guest must get 404');

        const memberRes =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.member,
            'media-literacy-detective',
          );
        assertEqual(memberRes.statusCode, 404, 'Member must get 404');

        const staffDenied =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.staffWithoutPortals,
            'media-literacy-detective',
          );
        assertEqual(
          staffDenied.statusCode,
          403,
          'Staff without portals.manage must get 403',
        );
        assert(
          h.logger.getLogs().some((entry) => entry.level === 'WARN'),
          '403 Staff denial must write a WARN log',
        );

        const staffAllowed =
          await h.studioExclusiveGameService.installAndPublishExclusiveGameAsync(
            h.staffWithPortals,
            'history-timeline-challenge',
          );
        assertEqual(
          staffAllowed.statusCode,
          200,
          'Staff with portals.manage must install exclusive game',
        );

        assert(
          envConfig.databaseVersion >= 21,
          'envConfig.databaseVersion must stay >= 21',
        );
        assertEqual(
          envConfig.stageNumber,
          31,
          'envConfig.stageNumber must equal 31',
        );
      } finally {
        h.cleanup();
      }
    },
  },
];
