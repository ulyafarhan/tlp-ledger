import { reactive, watch } from 'vue';

const STORE_KEY = 'tlp_app_settings';

// Default State
const defaultState = {
  shopName: 'Toko Saya',
  ownerName: 'Nama Pemilik',
  phone: '0812-xxxx-xxxx',
  address: 'Alamat Toko',
  theme: 'light'
};

// Load Initial State from LocalStorage
const savedState = localStorage.getItem(STORE_KEY);
const initialState = savedState ? JSON.parse(savedState) : defaultState;

export const appStore = reactive({
  ...initialState,

  updateSettings(data: Partial<typeof defaultState>) {
    Object.assign(this, data);
  }
});

// Auto-save ke LocalStorage setiap ada perubahan
watch(
  () => appStore,
  (state) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  },
  { deep: true }
);