<template>
    <div class="journal-scroll padding-right flex h-[50px] w-full select-none gap-2.5 overflow-x-auto overflow-y-hidden rounded-lg bg-white dark:bg-gray-900 px-3 py-2">
        <!-- All Category -->
        <span
            @click="handleCategoryClick(0)"
            :class="[
                'flex h-8 cursor-pointer items-center whitespace-nowrap rounded-lg border-2 border-transparent px-3 py-2 text-base font-medium transition-colors duration-200',
                activeCategoryId === 0
                    ? 'bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-200 !border-slate-600 dark:!border-slate-400'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
        >
            {{ $t('pos.home.categories.all') }}
        </span>

        <!-- Dynamic Categories -->
        <category-item
            v-for="category in categories"
            :key="`category-${category.id}`"
            :category="category"
            :active-category-id="activeCategoryId"
            :handle-category-click="handleCategoryClick"
            :is-child-active="isChildActive"
        />
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import CategoryItem from '@components/secured/home/CategoryItem.vue';

    /**
     * Define the props.
     */
    const props = defineProps({
        categories: {
            type: Array,
            required: true,
            default: () => [],
        },
        modelValue: {
            type: [Number, String],
            default: 0
        }
    });

    /**
     * Emits
     */
    const emit = defineEmits(['update:modelValue', 'category-selected']);

    /**
     * Reactive state
     */
    const activeCategoryId = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value)
    });

    /**
     * Check if any child category is currently active
     */
    const isChildActive = (children) => {
        if (
            ! children
            || ! children.length
        ) {
            return false;
        }

        return children.some(child => {
            return activeCategoryId.value === child.id
            || (child.children && isChildActive(child.children));
        });
    };

    /**
     * Handle category click event
     */
    const handleCategoryClick = (categoryId) => {
        activeCategoryId.value = categoryId;
        
        emit('category-selected', categoryId);
    };
</script>