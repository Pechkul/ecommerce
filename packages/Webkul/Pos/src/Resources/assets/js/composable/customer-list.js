import { ref, watch } from 'vue';
import { useIndexedDB } from '@src/composable/indexed-db';

const normalizeSearchValue = (value = '') => {
    return String(value ?? '').trim().toLowerCase();
};

export const useCustomerList = ({ perPage = 5 } = {}) => {
    const DB = useIndexedDB();
    const activeTab = ref('customers');
    const customers = ref([]);
    const searchTerm = ref('');
    const isLoading = ref(true);
    const pageInfo = ref({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        count: 0,
    });

    const paginateItems = (data, page = 1, limit = perPage) => {
        const total = data.length;
        const lastPage = Math.max(Math.ceil(total / limit), 1);
        const offset = (page - 1) * limit;
        const paginatedData = data.slice(offset, offset + limit);

        customers.value = paginatedData;
        pageInfo.value = {
            currentPage: page,
            lastPage,
            total,
            count: paginatedData.length,
        };
    };

    const getCustomersList = async (page = 1) => {
        isLoading.value = true;

        const result = await DB.paginateItems(activeTab.value, page, perPage);

        customers.value = result.data;
        pageInfo.value = result.paginatorInfo;
        isLoading.value = false;
    };

    const searchCustomers = async (term = '', page = 1, limit = perPage) => {
        isLoading.value = true;

        const db = await DB.getDb();
        const tx = db.transaction(activeTab.value, 'readonly');
        const store = tx.objectStore(activeTab.value);
        const normalizedTerm = normalizeSearchValue(term);
        const filteredData = [];

        let cursor = await store.openCursor(null, 'prev');

        while (cursor) {
            const value = cursor.value;
            const searchableFields = [
                value.firstName,
                value.lastName,
                value.email,
                value.phone,
            ].map(normalizeSearchValue).filter(Boolean);

            if (
                ! normalizedTerm
                || searchableFields.some(field => field.includes(normalizedTerm))
            ) {
                filteredData.push(value);
            }

            cursor = await cursor.continue();
        }

        paginateItems(filteredData, page, limit);
        isLoading.value = false;
    };

    const refreshCustomers = async (page = 1) => {
        if (normalizeSearchValue(searchTerm.value)) {
            await searchCustomers(searchTerm.value, page, perPage);

            return;
        }

        await getCustomersList(page);
    };

    const goToPage = async (page) => {
        await refreshCustomers(page);
    };

    watch(searchTerm, async (value) => {
        await searchCustomers(value, 1, perPage);
    });

    watch(activeTab, async () => {
        await refreshCustomers(1);
    });

    return {
        activeTab,
        customers,
        searchTerm,
        pageInfo,
        isLoading,
        getCustomersList,
        searchCustomers,
        refreshCustomers,
        goToPage,
    };
};
