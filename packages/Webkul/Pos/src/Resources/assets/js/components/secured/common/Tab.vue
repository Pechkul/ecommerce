<template>
    <div class="padding-right my-4 flex-1 flex flex-col gap-4 select-none">
        <!-- Tab Buttons -->
        <div class="flex gap-2.5 rounded-lg bg-white py-2 max-sm:text-center md:h-12 px-3 dark:bg-gray-900">
            <div
                v-for="(tab, index) in tabs"
                :key="index"
                @click="goToTab(tab.key)"
                :class="[currentTab === tab.key
                    ? 'bg-gray-100 text-slate-600 !border-slate-600 dark:bg-gray-800 dark:text-slate-300 dark:!border-slate-300'
                    : 'text-gray-900 dark:text-gray-200',
                ]"
                class="flex cursor-pointer items-center rounded-lg border-2 border-transparent px-3 py-2 text-base font-medium"
            >
                {{ $t(tab.titleKey) }}
            </div>
        </div>

        <!-- Active Tab Content -->
        <component
            :is="activeComponent"
            :key="currentTab"
            v-if="activeComponent"
        />
    </div>
</template>

<script setup>
    import { computed } from 'vue'
    import { useRouter } from 'vue-router'

    const props = defineProps({
        current: {
            type: String,
            required: true,
        },
        tabs: {
            type: Array,
            required: true,
        },
        routeBase: {
            type: String,
            required: true,
        },
    });

    const router = useRouter();

    const tabMap = computed(() => {
        const map = {};

        props.tabs.forEach(tab => {
            map[tab.key] = tab.component;
        });

        return map;
    })

    const currentTab = computed(() =>
        props.tabs.find(tab => tab.key === props.current)?.key || props.tabs[0].key
    );

    const activeComponent = computed(() => tabMap.value[currentTab.value]);

    const goToTab = (key) => {
        if (key !== currentTab.value) {
            router.push(`${props.routeBase}/${key}`)
        }
    }
</script>
