export interface MessageToClient {
  Command: string;
  Arguments: any;
}

export interface GOGCredential {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  session_id: string;
  refresh_token: string;
  user_id: string;
  loginTime: number;
}

export interface GalaxyLibraryEntry {
  background: null;
  certificate: string;
  comment: null;
  date_created: number;
  developers: null;
  external_id: string;
  generated_sorting_title: null;
  genres: null;
  hidden: boolean;
  linked_game_id: null;
  logo: null;
  my_rating: null;
  my_sorting_title: null;
  origin: string;
  owned: boolean;
  owned_since: number;
  platform_id: string;
  publishers: null;
  release_dates: null;
  square_icon: null;
  subscriptions: null;
  summary: null;
  themes: null;
  title: null;
  vertical_cover: null;
}

export interface OpenGalaxyLibraryConfig {
  items?: GalaxyLibraryEntry[];
  etag?: string;
}

interface SingleLanguageDataObject {
  id: string;
  name: string;
  slug: string;
}
type SingleLanguageDataObjectWithoutId = Omit<SingleLanguageDataObject, "id">;

interface MultiLanguageDataObject {
  id: string;
  name: LanguageMapper<string>;
  slug: string;
}

interface Release {
  id: string;
  platform_id: string;
  external_id: string;
  release_per_platform_id: string;
}
type MultiLanguageDataObjectWithoutId = Omit<MultiLanguageDataObject, "id">;

type LanguageMapper<T> = {
  "*": T;
  "en-US": T;
  [code: string]: T | undefined;
};

interface GamesDBDataBase {
  id: string;
  game_id: string;
  dlcs_ids: string[];
  // TODO; Was always `null` for all of my games, probably `string | null`
  parent_id: null;
  first_release_date: string;
  title: LanguageMapper<string>;
  sorting_title: LanguageMapper<string>;
  type: "game" | "spam" | "dlc";
  summary: LanguageMapper<string>;
  videos: {
    provider: "youtube";
    video_id: string;
    thumbnail_id: string;
    name: string | null;
  }[];
  game_modes: SingleLanguageDataObject[];
  logo: {
    url_format: string;
  };
  series: SingleLanguageDataObject;
}

export interface GamesDBData extends GamesDBDataBase {
  platform_id: string;
  external_id: string;
  dlcs: Release[];
  avaliable_languages: {
    code: string;
  }[];
  supported_operating_systems: SingleLanguageDataObjectWithoutId[];
  game: GamesDBDataInner;
  etag: string;
}

interface GamesDBDataInner extends GamesDBDataBase {
  releases: Release[];
  developers_ids: string[];
  developers: SingleLanguageDataObject[];
  publishers_ids: string[];
  publishers: SingleLanguageDataObject[];
  genres_ids: string[];
  genres: MultiLanguageDataObject[];
  themes_ids: string[];
  themes: MultiLanguageDataObject[];
  screenshots: {
    url_format: string;
  }[];
  artworks: {
    url_format: string;
  }[];
  visible_in_library: true;
  aggregated_rating: number | null;
  horizontal_artwork: {
    url_format: string;
  };
  background: {
    url_format: string;
  };
  vertical_cover: {
    url_format: string;
  };
  cover: {
    url_format: string;
  };
  icon?: {
    url_format: string;
  };
  square_icon: {
    url_format: string;
  };
  global_popularity_all_time: number;
  global_popularity_current: number;
}
