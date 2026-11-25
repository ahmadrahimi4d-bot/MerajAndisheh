import type {
  IStudioExclusiveGameCatalog,
  StudioExclusiveGameZipBuildResult,
} from '../../../core/abstractions/gameRepository';
import type { StudioExclusiveGameBlueprint } from '../../../core/domain/games';
import { createStoredZipBytes } from '../../storage/html5GamePackageService';
import {
  getHistoryTimelineFiles,
  HISTORY_TIMELINE_BLUEPRINT,
} from './historyTimelineGame';
import {
  getMediaLiteracyDetectiveFiles,
  MEDIA_LITERACY_DETECTIVE_BLUEPRINT,
} from './mediaLiteracyDetectiveGame';

const utf8Encoder = new TextEncoder();

export const STUDIO_EXCLUSIVE_BLUEPRINTS: readonly StudioExclusiveGameBlueprint[] = [
  MEDIA_LITERACY_DETECTIVE_BLUEPRINT,
  HISTORY_TIMELINE_BLUEPRINT,
];

export class StudioExclusiveGameCatalog implements IStudioExclusiveGameCatalog {
  public getBlueprints(): readonly StudioExclusiveGameBlueprint[] {
    return STUDIO_EXCLUSIVE_BLUEPRINTS;
  }

  public getBlueprintByCode(code: string): StudioExclusiveGameBlueprint | null {
    const clean = (code ?? '').trim();
    return STUDIO_EXCLUSIVE_BLUEPRINTS.find((bp) => bp.code === clean) ?? null;
  }

  public async buildGameZipBytesAsync(
    code: string,
  ): Promise<StudioExclusiveGameZipBuildResult | null> {
    const blueprint = this.getBlueprintByCode(code);
    if (!blueprint) {
      return null;
    }

    let rawFiles: Array<{ path: string; content: string }>;
    if (blueprint.code === MEDIA_LITERACY_DETECTIVE_BLUEPRINT.code) {
      rawFiles = getMediaLiteracyDetectiveFiles();
    } else if (blueprint.code === HISTORY_TIMELINE_BLUEPRINT.code) {
      rawFiles = getHistoryTimelineFiles();
    } else {
      return null;
    }

    const zipEntries = rawFiles.map((file) => ({
      path: file.path,
      bytes: utf8Encoder.encode(file.content),
    }));

    const bytes = createStoredZipBytes(zipEntries);
    return {
      fileName: `${blueprint.slug}.zip`,
      bytes,
      blueprint,
    };
  }
}
