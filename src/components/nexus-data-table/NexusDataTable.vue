<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import DataTable from 'primevue/datatable'

defineOptions({ inheritAttrs: false })

/**
 * Editorial data table: uppercase label headers, hairline rows and no fills.
 * Rows sit directly on the ambient so tables read like the rest of the page.
 */
const props = withDefaults(
  defineProps<{
    /** Kept for call-site compatibility; tables follow the ambient accent. */
    accent?: string
    value?: unknown[] | null
    loading?: boolean
    size?: 'small' | 'large' | undefined
    paginator?: boolean
    rows?: number
    lazy?: boolean
    totalRecords?: number
    stripedRows?: boolean
    emptyMessage?: string
  }>(),
  {
    accent: undefined,
    value: () => [],
    loading: false,
    size: 'small',
    paginator: false,
    rows: 25,
    lazy: false,
    stripedRows: false,
    emptyMessage: 'No rows to show.',
  },
)

const emit = defineEmits<{
  page: [event: { page?: number; first?: number; rows?: number }]
}>()

const attrs = useAttrs()

const tableValue = computed(() => props.value ?? [])
</script>

<template>
  <div class="nexus-data-table">
    <DataTable
      v-bind="attrs"
      :value="tableValue"
      :loading="loading"
      :size="size"
      :paginator="paginator"
      :rows="rows"
      :lazy="lazy"
      :total-records="totalRecords"
      :striped-rows="stripedRows"
      @page="emit('page', $event)"
    >
      <slot />
      <template #empty>
        <div class="ndt-empty">
          <slot name="empty">{{ emptyMessage }}</slot>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.nexus-data-table {
  width: 100%;
  overflow-x: auto;
}

.nexus-data-table :deep(.p-datatable),
.nexus-data-table :deep(.p-datatable-table-container) {
  background: transparent;
  border: 0;
}

.nexus-data-table :deep(.p-datatable-table) {
  border-collapse: collapse;
  width: 100%;
}

.nexus-data-table :deep(.p-datatable-thead > tr > th) {
  background: transparent !important;
  color: var(--ink-3) !important;
  border: 0 !important;
  border-bottom: 1px solid var(--line-strong) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 10px 12px !important;
  white-space: nowrap;
}

.nexus-data-table :deep(.p-datatable-thead > tr > th:first-child),
.nexus-data-table :deep(.p-datatable-tbody > tr > td:first-child) {
  padding-left: 0 !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  color: var(--ink);
}

.nexus-data-table :deep(.p-datatable-tbody > tr > td) {
  border: 0 !important;
  border-bottom: 1px solid var(--line) !important;
  padding: 11px 12px !important;
  color: var(--ink);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  vertical-align: middle;
  background: transparent !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr:hover > td) {
  background: var(--tint) !important;
}

.nexus-data-table :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: 0 !important;
}

.nexus-data-table :deep(code) {
  display: inline-block;
  padding: 2px 7px;
  border-radius: var(--r-xs);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  background: var(--tint-2);
}

.nexus-data-table :deep(.p-paginator) {
  background: transparent !important;
  border: 0 !important;
  border-top: 1px solid var(--line) !important;
  padding: 10px 0 0 !important;
  color: var(--ink-2);
}

.nexus-data-table :deep(.p-paginator .p-paginator-page-selected) {
  background: var(--ink) !important;
  color: var(--amb) !important;
  border-color: transparent !important;
}

.nexus-data-table :deep(.p-paginator-page),
.nexus-data-table :deep(.p-paginator-first),
.nexus-data-table :deep(.p-paginator-prev),
.nexus-data-table :deep(.p-paginator-next),
.nexus-data-table :deep(.p-paginator-last) {
  color: var(--ink-2) !important;
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
}

.nexus-data-table :deep(.p-datatable-mask),
.nexus-data-table :deep(.p-datatable-loading-overlay) {
  background: color-mix(in srgb, var(--amb) 55%, transparent) !important;
}

.ndt-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--ink-3);
  font-size: 14px;
}
</style>
