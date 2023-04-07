import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { AUTH_CONFIG_PATH, CONFIG_PATH } from "../constants";

export const createDefaultConfigs = () => {
  if (!existsSync(CONFIG_PATH)) {
    mkdirSync(CONFIG_PATH);
  }
  if (!existsSync(AUTH_CONFIG_PATH)) {
    writeFileSync(AUTH_CONFIG_PATH, "{}");
  }
};

export const readConfig = () => {
  return {
    bandwidthLimitScheduleStart: "10:00",
    bandwidthLimitScheduleStop: "19:00",
    bandwidthLimitValue: 1048576,
    createShortcutOnDesktop: false,
    desktopNotificationsPosition: "bottom_right",
    disallowProblemReports: false,
    featureAchievements: true,
    featureAutoUpdateGames: true,
    featureCloudSaves: true,
    featureGameTimeTracking: true,
    featureOverlay: true,
    keepLoggedIn: true,
    language: "en-US",
    limitBandwidth: false,
    notifChatMessage_desktop: true,
    notifChatMessage_overlay: true,
    notifDownloadStatus_desktop: true,
    notifDownloadStatus_overlay: true,
    notifFriendInvite_desktop: true,
    notifFriendInvite_overlay: true,
    notifFriendOnline_desktop: true,
    notifFriendOnline_overlay: false,
    notifFriendStartsGame_desktop: true,
    notifFriendStartsGame_overlay: false,
    notifGameInvite_desktop: true,
    notifGameInvite_overlay: true,
    notifSoundChatMessage_desktop: true,
    notifSoundChatMessage_overlay: true,
    notifSoundDownloadStatus_desktop: false,
    notifSoundDownloadStatus_overlay: false,
    notifSoundFriendInvite_desktop: true,
    notifSoundFriendInvite_overlay: true,
    notifSoundFriendOnline_desktop: false,
    notifSoundFriendOnline_overlay: false,
    notifSoundFriendStartsGame_desktop: false,
    notifSoundFriendStartsGame_overlay: false,
    notifSoundGameInvite_desktop: true,
    notifSoundGameInvite_overlay: true,
    notifSoundVolume: 50,
    overlayNotificationsPosition: "bottom_right",
    pauseDownloadsWhenPlaying: true,
    preferredGameLanguageCode: "pl-PL",
    scheduleBandwidthLimit: false,
    showFriendsSidebar: true,
    showedTrayBubble: false,
    skinId: "galaxyDark",
    startingPage: "discover_view",
  };
};

export const updateConfig = (value) => {};

export const getInitSettings = () => ({
  Languages: [],
  SettingsData: {
    languageCode: "en-US",
    notifChatMessage: true,
    notifDownloadStatus: true,
    notifDownloadStatus_overlay: true,
    notifFriendInvite: true,
    notifFriendOnline: true,
    notifFriendStartsGame: true,
    notifGameInvite: true,
    notifSoundChatMessage: true,
    notifSoundDownloadStatus: false,
    notifSoundFriendInvite: true,
    notifSoundFriendOnline: false,
    notifSoundFriendStartsGame: false,
    notifSoundGameInvite: true,
    notifSoundVolume: 50,
    showFriendsSidebar: true,
    store: {},
  },
  Endpoints: {
    api: "https://api.gog.com",
    chat: "https://chat.gog.com",
    externalAccounts: "https://external-accounts.gog.com",
    externalUsers: "https://external-users.gog.com",
    gameplay: "https://gameplay.gog.com",
    gog: "https://embed.gog.com",
    gogGalaxyStoreApi: "https://embed.gog.com",
    notifications: "https://notifications.gog.com",
    pusher: "https://notifications-pusher.gog.com",
    library: "https://galaxy-library.gog.com",
    presence: "https://presence.gog.com",
    users: "https://users.gog.com",
    redeem: "https://redeem.gog.com",
    marketingSections: "https://marketing-sections.gog.com",
    galaxyPromos: "https://galaxy-promos.gog.com",
    remoteConfigurationHost: "https://remote-config.gog.com",
    recommendations: "https://recommendations-api.gog.com",
  },
  ClientId: "46899977096215655",
  ChangelogBasePath: "",
  ClientVersions: { Major: 2, Minor: 0, Build: 61, Compilation: 1 },
  StartupPage: "discover_view",
});
