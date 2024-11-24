import { ModelBase } from './system';

interface SiteBase {
  code: string;
  name: Record<string, string | undefined>;
  region: string;
}

interface Site extends ModelBase, SiteBase {}

export type { SiteBase, Site };
