import { reactive, watch } from 'vue';

const STORE_KEY = 'tlp_app_settings';

// Default State
const defaultState = {
  nickname: '', 
  shopName: '',
  ownerName: '',
  phone: '',
  address: '',
};

const savedState = localStorage.getItem(STORE_KEY);
const initialSettings = savedState ? JSON.parse(savedState) : {};

export const appStore = reactive({
  nickname: initialSettings.nickname || '',
  shopName: initialSettings.shopName || '',
  ownerName: initialSettings.ownerName || '',
  phone: initialSettings.phone || '',
  address: initialSettings.address || '',

  updateSettings(data: Partial<typeof defaultState>) {
    Object.assign(this, data);
  }
});

// Auto-save ke LocalStorage setiap ada perubahan
watch(
  () => ({
    nickname: appStore.nickname,
    shopName: appStore.shopName,
    ownerName: appStore.ownerName,
    phone: appStore.phone,
    address: appStore.address,
  }),
  (settings) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  },
  { deep: true }
);