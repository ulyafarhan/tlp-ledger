import { reactive, watch } from 'vue';

const STORE_KEY = 'finance_ledger_settings'; 

const defaultState = {
  nickname: '', 
  shopName: '',
  ownerName: '',
  phone: '',
  address: '',
  hasSeenTutorial: false,
};

const savedState = localStorage.getItem(STORE_KEY);
const initialSettings = savedState ? JSON.parse(savedState) : {};

export const appStore = reactive({
  nickname: initialSettings.nickname || '',
  shopName: initialSettings.shopName || '',
  ownerName: initialSettings.ownerName || '',
  phone: initialSettings.phone || '',
  address: initialSettings.address || '',
  hasSeenTutorial: initialSettings.hasSeenTutorial || false,

  updateSettings(data: Partial<typeof defaultState>) {
    Object.assign(this, data);
  },

  completeTutorial() {
    this.hasSeenTutorial = true;
  }
});

watch(
  () => ({
    nickname: appStore.nickname,
    shopName: appStore.shopName,
    ownerName: appStore.ownerName,
    phone: appStore.phone,
    address: appStore.address,
    hasSeenTutorial: appStore.hasSeenTutorial,
  }),
  (settings) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  },
  { deep: true }
);