import type { IClock } from '../abstractions/IClock';
import type { ILogger } from '../abstractions/ILogger';
import type { IAdminRepository } from '../abstractions/adminRepository';
import type {
  IGamePackageStorage,
  IGameRepository,
  IStudioExclusiveGameCatalog,
} from '../abstractions/gameRepository';
import type { ITaxonomyRepository } from '../abstractions/taxonomyRepository';
import type { AppUser } from '../domain/auth';
import type {
  GameItem,
  StudioExclusiveBlueprintStatus,
  StudioExclusiveGameBlueprint,
} from '../domain/games';
import type { Topic } from '../domain/taxonomy';
import { DEFAULT_MAX_OTHER_MB } from './fileValidationService';
import {
  GAMES_ADMIN_ROUTE_PATH,
  GAMES_PERMISSION_KEY,
  type GamePortalServiceResult,
} from './gamePortalService';
import { normalizeDigits } from './identifierService';
import { PermissionPolicyService } from './permissionPolicyService';
import { ensureUniqueSlug, generateSlug } from './slugService';

export interface StudioExclusiveGameServiceDependencies {
  catalog: IStudioExclusiveGameCatalog;
  gameRepository: IGameRepository;
  packageStorage: IGamePackageStorage;
  taxonomyRepository: ITaxonomyRepository;
  adminRepository: IAdminRepository;
  policyService: PermissionPolicyService;
  clock: IClock;
  logger: ILogger;
}

export interface StudioExclusiveZipResult {
  ok: boolean;
  statusCode: 200 | 400;
  errorCode?: string;
  messageKey?: string;
  zipFileName?: string;
  bytes?: Uint8Array;
  blueprint?: StudioExclusiveGameBlueprint;
}

function parseMaxZipBytes(rawValue: string | null | undefined): number {
  const normalized = normalizeDigits(String(rawValue ?? '')).trim();
  if (/^\d+$/.test(normalized)) {
    const mb = Number.parseInt(normalized, 10);
    if (Number.isSafeInteger(mb) && mb >= 1 && mb <= 500) {
      return mb * 1024 * 1024;
    }
  }
  return DEFAULT_MAX_OTHER_MB * 1024 * 1024;
}

function findMatchingExclusiveGame(
  games: readonly GameItem[],
  blueprint: StudioExclusiveGameBlueprint,
): GameItem | null {
  const byCode = games.find((g) => g.exclusiveCode === blueprint.code);
  if (byCode) {
    return byCode;
  }
  const slugLower = blueprint.slug.trim().toLowerCase();
  return games.find((g) => g.slug.trim().toLowerCase() === slugLower) ?? null;
}

function resolveMatchingTopicId(
  topics: readonly Topic[],
  topicSlugHint: string | null,
): number | null {
  if (!topicSlugHint || topics.length === 0) {
    return null;
  }
  const normalizedHint = generateSlug(topicSlugHint);
  const direct = topics.find(
    (topic) =>
      topic.isActive &&
      (topic.slug === topicSlugHint ||
        topic.slug === normalizedHint ||
        generateSlug(topic.name) === normalizedHint),
  );
  return direct?.id ?? null;
}

export class StudioExclusiveGameService {
  private readonly catalog: IStudioExclusiveGameCatalog;
  private readonly gameRepository: IGameRepository;
  private readonly packageStorage: IGamePackageStorage;
  private readonly taxonomyRepository: ITaxonomyRepository;
  private readonly adminRepository: IAdminRepository;
  private readonly policyService: PermissionPolicyService;
  private readonly clock: IClock;
  private readonly logger: ILogger;

  constructor(deps: StudioExclusiveGameServiceDependencies) {
    this.catalog = deps.catalog;
    this.gameRepository = deps.gameRepository;
    this.packageStorage = deps.packageStorage;
    this.taxonomyRepository = deps.taxonomyRepository;
    this.adminRepository = deps.adminRepository;
    this.policyService = deps.policyService;
    this.clock = deps.clock;
    this.logger = deps.logger;
  }

  public async listStudioExclusiveBlueprints(): Promise<StudioExclusiveBlueprintStatus[]> {
    const blueprints = this.catalog.getBlueprints();
    const games = await this.gameRepository.getAllGamesAsync();

    return blueprints.map((blueprint) => {
      const matched = findMatchingExclusiveGame(games, blueprint);
      return {
        ...blueprint,
        isInstalled: Boolean(matched),
        isPublished: Boolean(matched?.isPublished),
        installedGame: matched,
      };
    });
  }

  public async buildExclusiveGameZipAsync(code: string): Promise<StudioExclusiveZipResult> {
    const built = await this.catalog.buildGameZipBytesAsync(code);
    if (!built) {
      return {
        ok: false,
        statusCode: 400,
        errorCode: 'ENTITY_NOT_FOUND',
        messageKey: 'admin.portals.games.exclusive.error.notFound',
      };
    }

    const maxSetting = await this.adminRepository.getSiteSettingByKey('Upload.MaxOtherMb');
    const maxBytes = parseMaxZipBytes(maxSetting?.value);
    const validation = await this.packageStorage.validateAndExtractZipAsync({
      fileName: built.fileName,
      bytes: built.bytes,
      maxTotalBytes: maxBytes,
    });

    if (!validation.ok) {
      return {
        ok: false,
        statusCode: 400,
        errorCode: validation.errorCode ?? 'ZIP_INVALID_FORMAT',
        messageKey:
          validation.messageKey ?? 'admin.portals.games.error.zipInvalidFormat',
      };
    }

    return {
      ok: true,
      statusCode: 200,
      zipFileName: built.fileName,
      bytes: built.bytes,
      blueprint: built.blueprint,
    };
  }

  public async installAndPublishExclusiveGameAsync(
    actor: AppUser | null,
    code: string,
    routePath: string = GAMES_ADMIN_ROUTE_PATH,
  ): Promise<GamePortalServiceResult<GameItem>> {
    const auth = await this.policyService.authorizePermission(
      actor,
      GAMES_PERMISSION_KEY,
      routePath,
    );
    if (!auth.allowed || !actor) {
      return {
        ok: false,
        statusCode: auth.statusCode,
        errorCode: auth.statusCode === 404 ? 'NOT_FOUND' : 'FORBIDDEN',
        messageKey: auth.statusCode === 404 ? 'notFound.title' : 'admin.forbidden.title',
      };
    }

    return this.installOrUpdateInternalAsync(code, actor.id, false);
  }

  public async ensureDefaultExclusiveGameSeededAsync(
    code: string = 'media-literacy-detective',
  ): Promise<GameItem | null> {
    const blueprint = this.catalog.getBlueprintByCode(code);
    if (!blueprint) {
      return null;
    }
    const existingGames = await this.gameRepository.getAllGamesAsync();
    const existing = findMatchingExclusiveGame(existingGames, blueprint);
    if (existing) {
      return existing;
    }

    const res = await this.installOrUpdateInternalAsync(code, 1, true);
    return res.ok ? (res.data ?? null) : null;
  }

  private async installOrUpdateInternalAsync(
    code: string,
    actorId: number,
    isStartupSeed: boolean,
  ): Promise<GamePortalServiceResult<GameItem>> {
    const built = await this.catalog.buildGameZipBytesAsync(code);
    if (!built) {
      return {
        ok: false,
        statusCode: 400,
        errorCode: 'ENTITY_NOT_FOUND',
        messageKey: 'admin.portals.games.exclusive.error.notFound',
      };
    }

    const maxSetting = await this.adminRepository.getSiteSettingByKey('Upload.MaxOtherMb');
    const maxBytes = parseMaxZipBytes(maxSetting?.value);
    const zipValidation = await this.packageStorage.validateAndExtractZipAsync({
      fileName: built.fileName,
      bytes: built.bytes,
      maxTotalBytes: maxBytes,
    });

    if (!zipValidation.ok) {
      this.logger.warn('STUDIO_EXCLUSIVE_ZIP_INVALID', {
        actorId,
        code,
        errorCode: zipValidation.errorCode,
      });
      return {
        ok: false,
        statusCode: 400,
        errorCode: zipValidation.errorCode ?? 'ZIP_INVALID_FORMAT',
        messageKey:
          zipValidation.messageKey ?? 'admin.portals.games.error.zipInvalidFormat',
        invalidFileName: zipValidation.invalidFileName,
      };
    }

    const { blueprint } = built;
    const [existingGames, activeAgeGroups, allTopics] = await Promise.all([
      this.gameRepository.getAllGamesAsync(),
      this.adminRepository.getActiveAgeGroups(),
      this.taxonomyRepository.getAllTopics(),
    ]);

    const ageIdByKey = new Map(activeAgeGroups.map((ag) => [ag.key, ag.id]));
    const ageGroupIds: number[] = [];
    for (const ageKey of blueprint.targetAgeKeys) {
      const id = ageIdByKey.get(ageKey);
      if (id !== undefined && !ageGroupIds.includes(id)) {
        ageGroupIds.push(id);
      }
    }

    const topicId = resolveMatchingTopicId(allTopics, blueprint.topicSlugHint);
    const existing = findMatchingExclusiveGame(existingGames, blueprint);
    const nowIso = this.clock.nowUtcIso();
    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    const packageFolder = `studio-${blueprint.code}-${Date.now()}-${randSuffix}`;

    await this.packageStorage.savePackageAsync({
      packageFolder,
      originalZipName: built.fileName,
      entries: zipValidation.entries,
      totalSizeBytes: zipValidation.totalSizeBytes,
      createdAt: nowIso,
    });

    if (existing) {
      const oldPackageFolder = existing.packageFolder;
      const otherSlugs = existingGames
        .filter((g) => g.id !== existing.id)
        .map((g) => g.slug);
      const nextSlug = ensureUniqueSlug(blueprint.slug, otherSlugs);

      const updated = await this.gameRepository.updateGameAsync({
        ...existing,
        title: blueprint.title,
        slug: nextSlug,
        description: blueprint.description,
        endMessage: blueprint.endMessage,
        packageFolder,
        topicId,
        maxScore: blueprint.maxScore,
        isPublished: true,
        isStudioExclusive: true,
        exclusiveCode: blueprint.code,
        updatedAt: nowIso,
      });

      await this.gameRepository.replaceGameAgeGroupsAsync(updated.id, ageGroupIds);
      if (oldPackageFolder && oldPackageFolder !== packageFolder) {
        await this.packageStorage.deletePackageAsync(oldPackageFolder);
      }

      this.logger.info('STUDIO_EXCLUSIVE_GAME_UPDATED', {
        actorId,
        gameId: updated.id,
        exclusiveCode: blueprint.code,
        version: blueprint.version,
        filesCount: zipValidation.entries.length,
      });

      return {
        ok: true,
        statusCode: 200,
        data: updated,
      };
    }

    const existingSlugs = existingGames.map((g) => g.slug);
    const uniqueSlug = ensureUniqueSlug(blueprint.slug, existingSlugs);

    const created = await this.gameRepository.createGameAsync({
      title: blueprint.title,
      slug: uniqueSlug,
      description: blueprint.description,
      endMessage: blueprint.endMessage,
      thumbnailKey: null,
      packageFolder,
      topicId,
      maxScore: blueprint.maxScore,
      isPublished: true,
      isStudioExclusive: true,
      exclusiveCode: blueprint.code,
      createdById: actorId,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await this.gameRepository.replaceGameAgeGroupsAsync(created.id, ageGroupIds);

    this.logger.info(
      isStartupSeed ? 'STUDIO_EXCLUSIVE_GAME_SEEDED' : 'STUDIO_EXCLUSIVE_GAME_INSTALLED',
      {
        actorId,
        gameId: created.id,
        exclusiveCode: blueprint.code,
        version: blueprint.version,
        filesCount: zipValidation.entries.length,
      },
    );

    return {
      ok: true,
      statusCode: 200,
      data: created,
    };
  }
}
