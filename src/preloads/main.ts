import { ipcRenderer } from "electron";

declare global {
  interface Window {
    galaxyInitData: any;
    sendToClient: (message: string) => void;
    sendToOverlay: (message: string) => void;
    registerCallbackWithNative: (callback: () => any) => boolean;
  }
}

window.galaxyInitData = {
  os: "windows",
  osVersion: "6.0",
  driverVersions: [],
  endpoints: {
    api: "https://api.gog.com",
    chat: "https://chat.gog.com",
    externalAccounts: "https://external-accounts.gog.com",
    externalUsers: "https://external-users.gog.com",
    gameplay: "https://gameplay.gog.com",
    gog: "https://embed.gog.com",
    gogGalaxyStoreApi: "https://embed.gog.com",
    marketingSections: "https://marketing-sections.gog.com",
    library: "https://galaxy-library.gog.com",
    users: "https://users.gog.com",
    redeem: "https://redeem.gog.com",
  },
  environemnt: "x64",
  loggingLevel: 8,
  initialGameReleaseKeys: {
    installedGameReleaseKeys: [],
  },
  friendsRecentPlaySessions: { items: [] },
  settingsData: {
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
  userData: {
    country: "PL",
    currencies: [
      { code: "PLN", symbol: "z\u0142" },
      { code: "EUR", symbol: "\u20ac" },
      { code: "USD", symbol: "$" },
    ],
    selectedCurrency: { code: "PLN", symbol: "z\u0142" },
    preferredLanguage: { code: "pl", name: "polski" },
    ratingBrand: "PEGI",
    isLoggedIn: true,
    checksum: {
      cart: null,
      games: "b76332c7f3d811cb0fb81a1990eca2ec",
      wishlist: "8eacabc52306c38d5aa2c6f356ffe711",
      reviews_votes: null,
      games_rating: null,
    },
    updates: {
      messages: 0,
      pendingFriendRequests: 0,
      unreadChatMessages: 0,
      products: 15,
      total: 15,
    },
    username: "imLinguin",
    presence: "online",
    userId: "52382489165353163",
    email: "lidwinpawel@gmail.com",
    avatar:
      "https://images.gog.com/26a61c06df65ba772315a96d5568dc765faeb1e504f5d4b338264188bd90f6de",
    walletBalance: { currency: "PLN", amount: 0 },
    purchasedItems: { games: 128, movies: 1 },
    wishlistedItems: 4,
    friends: [
      {
        username: "trigonometrie",
        userSince: 1446729801,
        galaxyId: "48544196715435089",
        avatar:
          "https://images.gog.com/8fd8ebce55d2afc7d53f2457a2d0ce65b437b3b451a395ba7ff6c7f4f7b48a1d",
      },
      {
        username: "szszoke",
        userSince: 1595349637,
        galaxyId: "53531050698381380",
        avatar:
          "https://images.gog.com/3f9e109ac09308f7d52c607c8571e63d5fb482acca499a83e767dfff7f00d57d",
      },
      {
        username: "Olboy",
        userSince: 1506069651,
        galaxyId: "50535311672960964",
        avatar:
          "https://images.gog.com/d18170aea1e2a9c8c1cae6376184230a587e6c833e640258c5418e80d1331bbc",
      },
      {
        username: "xTKEYY",
        userSince: 1567942227,
        galaxyId: "52611410836591854",
        avatar:
          "https://images.gog.com/2522cb6b4cba55d0f714218330b11326fd6e0306807ade8deafff4bcb12e2fe1",
      },
      {
        username: "Yepoleb",
        userSince: 1449237763,
        galaxyId: "48628349957132247",
        avatar:
          "https://images.gog.com/7609843934988522da291b49b951cbfa63b5495730daa349c29f5717b89c09b4",
      },
    ],
    personalizedProductPrices: [],
    personalizedSeriesPrices: [],
  },
  instantLicenseGames: [],
  instantLicenseGrks: [],
  connectedPlatforms: [],
  inSingleGameMode: false,
  installationSource: "gog",
};

window.sendToClient = (message: string) => {
  ipcRenderer.send("sendToClient", message);
};

window.sendToOverlay = (message: string) => {
  console.log("overlay", message);
};

window.registerCallbackWithNative = (callback: (message: string) => any) => {
  ipcRenderer.on("callback", (_, data) => {
    callback(data);
  });
  return true;
};
