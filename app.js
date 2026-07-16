/**
 * Paddulu Ledger - Application Logic
 * Implements state management, CRUD, local storage hooks, real-time calculations,
 * search & date filtering, Indian Rupee localization, CSV export, and print functions.
 */

// --- Global State ---
let supabaseClient = null;
let ledgerEntries = [];
let currentSort = { column: 'date', direction: 'desc' };
let selectedCalendarDate = null;
let calendarViewDate = new Date();
let tempEditDebits = [];
let editDebitIdToEdit = null;
let tempEditRds = [];
let editRdIdToEdit = null;
let adminOverride = false;
let selectedEntryIds = new Set();
let tempAddBank = { account: '', ifsc: '' };
let tempEditBank = { account: '', ifsc: '' };
let activeBankFormType = 'add'; // 'add' or 'edit'

// --- DOM Elements ---
const dom = {
  // Main Entry Form
  form: document.getElementById('ledger-form'),
  inputDate: document.getElementById('input-date'),
  inputName: document.getElementById('input-name'),
  inputPhone: document.getElementById('input-phone'),
  inputCold: document.getElementById('input-cold'),
  inputBags: document.getElementById('input-bags'),
  inputBill: document.getElementById('input-bill'),
  inputRd: document.getElementById('input-rd'),
  inputFirm: document.getElementById('input-firm'),
  displayTotal: document.getElementById('display-total'),
  btnClearForm: document.getElementById('btn-clear'),

  // KPI Elements
  kpiEntriesLabel: document.querySelector('#card-total-entries .kpi-label'),
  valTotalEntries: document.getElementById('val-total-entries'),
  valTotalBags: document.getElementById('val-total-bags'),
  valTotalBill: document.getElementById('val-total-bill'),
  valTotalRd: document.getElementById('val-total-rd'),
  valGrandTotal: document.getElementById('val-grand-total'),

  // Filters & Actions
  searchName: document.getElementById('search-name'),
  filterStartDate: document.getElementById('filter-start-date'),
  filterEndDate: document.getElementById('filter-end-date'),
  btnClearFilters: document.getElementById('btn-clear-filters'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnPrint: document.getElementById('btn-print'),

  // Table & List View
  tableHeaders: document.querySelectorAll('#ledger-table th.sortable'),
  tableRows: document.getElementById('ledger-rows'),
  noRecordsMsg: document.getElementById('no-records-msg'),

  // Edit Modal Elements
  editModal: document.getElementById('edit-modal'),
  editForm: document.getElementById('edit-form'),
  editId: document.getElementById('edit-entry-id'),
  editDate: document.getElementById('edit-date'),
  editName: document.getElementById('edit-name'),
  editPhone: document.getElementById('edit-phone'),
  editCold: document.getElementById('edit-cold'),
  editBags: document.getElementById('edit-bags'),
  editBill: document.getElementById('edit-bill'),
  editRd: document.getElementById('edit-rd'),
  editFirm: document.getElementById('edit-firm'),
  debitTableEdit: document.getElementById('debit-table-edit'),
  debitSummaryEdit: document.getElementById('debit-summary-edit'),
  rdTableEdit: document.getElementById('rd-table-edit'),
  rdSummaryEdit: document.getElementById('rd-summary-edit'),
  editTotal: document.getElementById('edit-total'),
  btnModalClose: document.getElementById('btn-modal-close'),
  btnEditCancel: document.getElementById('btn-edit-cancel'),

  // Bank Modal Elements
  bankModal: document.getElementById('bank-modal'),
  btnBankModalClose: document.getElementById('btn-bank-modal-close'),
  btnBankModalCancel: document.getElementById('btn-bank-modal-cancel'),
  bankPopupForm: document.getElementById('bank-popup-form'),
  popupBankAccount: document.getElementById('popup-bank-account'),
  popupBankIfsc: document.getElementById('popup-bank-ifsc'),
  btnAddBankAdd: document.getElementById('btn-add-bank-add'),
  btnAddBankEdit: document.getElementById('btn-add-bank-edit'),
  bankSummaryAdd: document.getElementById('bank-summary-add'),
  bankSummaryEdit: document.getElementById('bank-summary-edit'),

  // Add Entry Modal Elements
  addEntryModal: document.getElementById('add-entry-modal'),
  btnAddModalClose: document.getElementById('btn-add-modal-close'),
  btnTriggerAddNew: document.getElementById('btn-trigger-add-new'),

  // Toasts
  toastContainer: document.getElementById('toast-container'),

  // Authentication
  loginContainer: document.getElementById('login-container'),
  loginCard: document.querySelector('.login-card'),
  loginForm: document.getElementById('login-form'),
  loginId: document.getElementById('login-id'),
  loginPassword: document.getElementById('login-password'),
  loginRemember: document.getElementById('login-remember'),
  btnTogglePassword: document.getElementById('btn-toggle-password'),
  btnLogout: document.getElementById('btn-logout'),

  // Debit Popup Modal Elements
  btnAddDebitEdit: document.getElementById('btn-add-debit-edit'),
  debitModal: document.getElementById('debit-modal'),
  debitPopupForm: document.getElementById('debit-popup-form'),
  popupDebitAmount: document.getElementById('popup-debit-amount'),
  popupDebitDate: document.getElementById('popup-debit-date'),
  popupDebitUtr: document.getElementById('popup-debit-utr'),
  btnDebitModalClose: document.getElementById('btn-debit-modal-close'),
  btnDebitModalCancel: document.getElementById('btn-debit-modal-cancel'),

  // RD Popup Modal Elements
  btnAddRdEdit: document.getElementById('btn-add-rd-edit'),
  rdModal: document.getElementById('rd-modal'),
  rdPopupForm: document.getElementById('rd-popup-form'),
  popupRdAmount: document.getElementById('popup-rd-amount'),
  popupRdDate: document.getElementById('popup-rd-date'),
  btnRdModalClose: document.getElementById('btn-rd-modal-close'),
  btnRdModalCancel: document.getElementById('btn-rd-modal-cancel'),

  // View Details & Admin Unlock Elements
  btnAdminUnlock: document.getElementById('btn-admin-unlock'),
  viewDetailsModal: document.getElementById('view-details-modal'),
  viewDetailsBody: document.getElementById('view-details-body'),
  btnViewClose: document.getElementById('btn-view-close'),
  btnViewCloseFooter: document.getElementById('btn-view-close-footer'),
  btnViewPrint: document.getElementById('btn-view-print'),

  // Bulk Actions Elements
  selectAllEntries: document.getElementById('select-all-entries'),
  bulkActionsBar: document.getElementById('bulk-actions-bar'),
  bulkSelectCount: document.getElementById('bulk-select-count'),
  btnBulkClear: document.getElementById('btn-bulk-clear'),
  btnBulkPrint: document.getElementById('btn-bulk-print'),
  btnBulkCsv: document.getElementById('btn-bulk-csv'),
  btnBulkDelete: document.getElementById('btn-bulk-delete'),
  bulkTotalsSummary: document.getElementById('bulk-totals-summary'),

  // Calendar Elements
  btnPrevMonth: document.getElementById('btn-prev-month'),
  btnNextMonth: document.getElementById('btn-next-month'),
  calendarMonthYear: document.getElementById('calendar-month-year'),
  calendarDaysGrid: document.getElementById('calendar-days-grid'),
  calendarFilterStatus: document.getElementById('calendar-filter-status'),
  selectedCalendarDateLabel: document.getElementById('selected-calendar-date-label'),
  btnClearCalendarFilter: document.getElementById('btn-clear-calendar-filter'),

  // Supabase Elements
  btnSupabaseSettings: document.getElementById('btn-supabase-settings'),
  supabaseModal: document.getElementById('supabase-modal'),
  btnSupabaseModalClose: document.getElementById('btn-supabase-modal-close'),
  btnSupabaseModalCancel: document.getElementById('btn-supabase-modal-cancel'),
  supabaseConfigForm: document.getElementById('supabase-config-form'),
  popupSupabaseUrl: document.getElementById('popup-supabase-url'),
  popupSupabaseKey: document.getElementById('popup-supabase-key')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Supabase configuration
  initSupabase();

  // Setup Authentication first
  initAuthentication();

  // Set default form date to today
  const today = new Date().toISOString().split('T')[0];
  dom.inputDate.value = today;

  // Load entries from database
  loadLedgerEntries().then(() => {
    // Initial render
    if (isAuthenticated()) {
      renderApp();
    }
  });

  // Attach Event Listeners
  attachFormListeners();
  attachAddEntryModalListeners();
  attachFilterListeners();
  attachTableListeners();
  attachModalListeners();
  attachUtilityListeners();
  attachAuthListeners();
  attachCalendarListeners();
  attachDebitPopupListeners();
  attachRdPopupListeners();
  attachBankModalListeners();
  attachViewDetailsListeners();
  attachSupabaseListeners();
});

// --- State Methods ---
// --- State Methods & Supabase Sync ---

function initSupabase() {
  let url = window.SUPABASE_URL || localStorage.getItem('paddulu_supabase_url');
  let key = window.SUPABASE_ANON_KEY || localStorage.getItem('paddulu_supabase_key');

  if (url && (url.includes('YOUR_') || url.includes('placeholder'))) url = null;
  if (key && (key.includes('YOUR_') || key.includes('placeholder'))) key = null;

  if (url && key) {
    try {
      supabaseClient = supabase.createClient(url, key);
      console.log('Supabase client initialized successfully.');
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      showToast('Invalid Supabase configuration details.', 'error');
    }
  } else {
    // Show setup modal if not configured (delayed slightly to wait for DOM ready)
    setTimeout(() => {
      if (isAuthenticated()) {
        openSupabaseModal();
      }
    }, 500);
  }
}

function openSupabaseModal() {
  dom.popupSupabaseUrl.value = localStorage.getItem('paddulu_supabase_url') || '';
  dom.popupSupabaseKey.value = localStorage.getItem('paddulu_supabase_key') || '';
  dom.supabaseModal.showModal();
}

function attachSupabaseListeners() {
  dom.btnSupabaseSettings.addEventListener('click', () => {
    openSupabaseModal();
  });

  const closeSupabaseModal = () => {
    dom.supabaseModal.close();
  };
  dom.btnSupabaseModalClose.addEventListener('click', closeSupabaseModal);
  dom.btnSupabaseModalCancel.addEventListener('click', closeSupabaseModal);

  dom.supabaseModal.addEventListener('click', (e) => {
    if (e.target === dom.supabaseModal) {
      closeSupabaseModal();
    }
  });

  dom.supabaseConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlVal = dom.popupSupabaseUrl.value.trim();
    const keyVal = dom.popupSupabaseKey.value.trim();

    if (!urlVal || !keyVal) {
      showToast('Please enter both Supabase URL and Key.', 'error');
      return;
    }

    try {
      // Test client creation
      const testClient = supabase.createClient(urlVal, keyVal);
      // Test table read (verifying that table ledger_entries exists)
      const { data, error } = await testClient.from('ledger_entries').select('id').limit(1);
      if (error) throw error;

      // Save credentials if connection test succeeds
      localStorage.setItem('paddulu_supabase_url', urlVal);
      localStorage.setItem('paddulu_supabase_key', keyVal);
      supabaseClient = testClient;

      showToast('Connected to Supabase database successfully!', 'success');
      closeSupabaseModal();

      // Reload data
      await loadLedgerEntries();
      renderApp();
    } catch (err) {
      console.error('Connection test failed:', err);
      showToast('Connection test failed! Please verify keys or database tables. Error: ' + err.message, 'error');
    }
  });
}

function mapRowToEntry(row) {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    firmName: row.firm_name || '',
    phone: row.phone || '',
    coldName: row.cold_name || '',
    bags: parseInt(row.bags) || 0,
    billAmount: parseFloat(row.bill_amount) || 0,
    rdAmount: parseFloat(row.rd_amount) || 0,
    debitAmount: parseFloat(row.debit_amount) || 0,
    debits: row.debits || [],
    rds: row.rds || [],
    bankAccount: row.bank_account || '',
    bankIfsc: row.bank_ifsc || '',
    totalAmount: parseFloat(row.total_amount) || 0
  };
}

function mapEntryToRow(entry) {
  return {
    id: entry.id,
    date: entry.date,
    name: entry.name,
    firm_name: entry.firmName || null,
    phone: entry.phone || null,
    cold_name: entry.coldName || null,
    bags: entry.bags,
    bill_amount: entry.billAmount,
    rd_amount: entry.rdAmount,
    debit_amount: entry.debitAmount,
    debits: entry.debits || [],
    rds: entry.rds || [],
    bank_account: entry.bankAccount || null,
    bank_ifsc: entry.bankIfsc || null,
    total_amount: entry.totalAmount
  };
}

async function loadLedgerEntries() {
  if (!supabaseClient) {
    console.warn('Supabase not connected. Cannot load entries from cloud.');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('ledger_entries')
      .select('*');

    if (error) throw error;

    let entries = (data || []).map(mapRowToEntry);

    // Auto migration fallback (if cloud database is empty, pull local backups)
    let localData = localStorage.getItem('paddulu_ledger_entries');
    if (entries.length === 0) {
      // 1. Try to fetch from local server data.json file database
      try {
        const response = await fetch('/api/entries');
        if (response.ok) {
          const serverEntries = await response.json();
          if (serverEntries && serverEntries.length > 0) {
            entries = serverEntries;
            showToast('Migrating server JSON database to Supabase...', 'info');
          }
        }
      } catch (err) {
        console.log('No local server database found (expected in production).');
      }

      // 2. Try to fetch from localStorage
      if (entries.length === 0 && localData) {
        try {
          entries = JSON.parse(localData);
          showToast('Migrating local browser storage to Supabase...', 'info');
        } catch (err) {
          console.error(err);
        }
      }

      // Upload migrated items to Supabase
      if (entries.length > 0) {
        const rows = entries.map(mapEntryToRow);
        const { error: uploadError } = await supabaseClient.from('ledger_entries').upsert(rows);
        if (!uploadError) {
          showToast('Migrated all entries to cloud database!', 'success');
          localStorage.removeItem('paddulu_ledger_entries');
        } else {
          console.error('Upload migration error:', uploadError);
        }
      }
    }

    ledgerEntries = entries;
  } catch (error) {
    console.error('Failed to load ledger entries from Supabase:', error);
    showToast('Failed to read database records from Supabase.', 'error');
  }
}

async function saveLedgerEntries() {
  // Sync to local server file backup if running locally (server.js running)
  try {
    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ledgerEntries)
    });
  } catch (error) {
    // Ignore fail since it is expected when deployed to GitHub Pages
  }
}

async function saveSupabaseEntry(entry) {
  if (!supabaseClient) return;
  try {
    const row = mapEntryToRow(entry);
    const { error } = await supabaseClient.from('ledger_entries').upsert(row);
    if (error) throw error;
  } catch (error) {
    console.error('Supabase save error:', error);
    showToast('Failed to save record to Supabase.', 'error');
  }
}

async function deleteSupabaseEntry(id) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('ledger_entries').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Supabase delete error:', error);
    showToast('Failed to delete record from Supabase.', 'error');
  }
}

async function deleteSupabaseEntries(ids) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('ledger_entries').delete().in('id', ids);
    if (error) throw error;
  } catch (error) {
    console.error('Supabase batch delete error:', error);
    showToast('Failed to delete selected records from Supabase.', 'error');
  }
}

// --- Event Listeners Attachment ---

function attachFormListeners() {
  // Real-time calculation on Main Form inputs
  const calculateMainTotal = () => {
    const bill = parseFloat(dom.inputBill.value) || 0;
    const rd = parseFloat(dom.inputRd.value) || 0;
    dom.displayTotal.value = formatCurrencyNumber(bill + rd);
  };
  dom.inputBill.addEventListener('input', calculateMainTotal);
  dom.inputRd.addEventListener('input', calculateMainTotal);

  // Form Submit
  dom.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm(dom.form)) {
      const billVal = parseFloat(dom.inputBill.value) || 0;
      const rdVal = parseFloat(dom.inputRd.value) || 0;

      const entry = {
        id: Date.now().toString(),
        date: dom.inputDate.value,
        name: dom.inputName.value.trim(),
        firmName: dom.inputFirm.value.trim(),
        phone: dom.inputPhone.value.trim(),
        coldName: dom.inputCold.value.trim(),
        bags: parseInt(dom.inputBags.value, 10),
        billAmount: billVal,
        rdAmount: rdVal,
        debitAmount: 0,
        debits: [],
        bankAccount: tempAddBank.account,
        bankIfsc: tempAddBank.ifsc,
        totalAmount: billVal + rdVal
      };

      ledgerEntries.push(entry);
      saveLedgerEntries();
      saveSupabaseEntry(entry);
      currentSort = { column: 'date', direction: 'desc' };
      renderApp();

      // Reset Form fields (keep date as is for ease of sequential entry)
      dom.inputName.value = '';
      dom.inputFirm.value = '';
      dom.inputPhone.value = '';
      dom.inputCold.value = '';
      dom.inputBags.value = '';
      dom.inputBill.value = '';
      dom.inputRd.value = '';
      dom.displayTotal.value = '0.00';
      tempAddBank = { account: '', ifsc: '' };
      updateBankSummary('add');
      
      clearErrors(dom.form);
      showToast('Ledger entry added successfully!', 'success');
      if (dom.addEntryModal && typeof dom.addEntryModal.close === 'function') {
        dom.addEntryModal.close();
      }
    }
  });

  // Clear Button
  dom.btnClearForm.addEventListener('click', () => {
    dom.form.reset();
    dom.inputDate.value = new Date().toISOString().split('T')[0];
    dom.displayTotal.value = '0.00';
    tempAddBank = { account: '', ifsc: '' };
    updateBankSummary('add');
    clearErrors(dom.form);
  });
}

function attachAddEntryModalListeners() {
  if (!dom.btnTriggerAddNew || !dom.addEntryModal) return;

  // Open modal
  dom.btnTriggerAddNew.addEventListener('click', () => {
    // Reset Form fields on open so it is fresh, but keep date as today
    dom.inputName.value = '';
    dom.inputFirm.value = '';
    dom.inputPhone.value = '';
    dom.inputCold.value = '';
    dom.inputBags.value = '';
    dom.inputBill.value = '';
    dom.inputRd.value = '';
    dom.displayTotal.value = '0.00';
    dom.inputDate.value = new Date().toISOString().split('T')[0];
    tempAddBank = { account: '', ifsc: '' };
    updateBankSummary('add');
    clearErrors(dom.form);

    dom.addEntryModal.showModal();
  });

  // Close modal with close button
  if (dom.btnAddModalClose) {
    dom.btnAddModalClose.addEventListener('click', () => {
      dom.addEntryModal.close();
    });
  }

  // Clear button inside form should also close modal
  dom.btnClearForm.addEventListener('click', () => {
    dom.addEntryModal.close();
  });

  // Handle outside modal click to close
  dom.addEntryModal.addEventListener('click', (e) => {
    if (e.target === dom.addEntryModal) {
      dom.addEntryModal.close();
    }
  });
}

function attachFilterListeners() {
  // Search input events
  dom.searchName.addEventListener('input', () => {
    renderApp();
    toggleClearFiltersButton();
  });

  // Date range inputs
  dom.filterStartDate.addEventListener('change', () => {
    renderApp();
    toggleClearFiltersButton();
  });
  dom.filterEndDate.addEventListener('change', () => {
    renderApp();
    toggleClearFiltersButton();
  });

  // Clear Filters button
  dom.btnClearFilters.addEventListener('click', () => {
    dom.searchName.value = '';
    dom.filterStartDate.value = '';
    dom.filterEndDate.value = '';
    renderApp();
    toggleClearFiltersButton();
  });
}

function attachTableListeners() {
  // Column Sorting
  dom.tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (currentSort.column === column) {
        // Toggle direction
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
      }
      renderApp();
    });
  });

  // Master selection checkbox toggle
  dom.selectAllEntries.addEventListener('change', (e) => {
    const visibleEntries = getSortedEntries(getFilteredEntries());
    if (e.target.checked) {
      visibleEntries.forEach(entry => selectedEntryIds.add(entry.id));
    } else {
      visibleEntries.forEach(entry => selectedEntryIds.delete(entry.id));
    }
    renderApp();
  });
}

function attachModalListeners() {
  // Open Debit Popup dialog on click
  dom.btnAddDebitEdit.addEventListener('click', () => {
    openDebitPopup('edit');
  });

  // Open RD Popup dialog on click
  dom.btnAddRdEdit.addEventListener('click', () => {
    openRdPopup('edit');
  });

  // Handle Admin Unlock Password Prompts
  dom.btnAdminUnlock.addEventListener('click', () => {
    if (adminOverride) {
      // Re-lock
      adminOverride = false;
      dom.btnAdminUnlock.classList.add('locked');
      dom.btnAdminUnlock.classList.remove('unlocked');
      dom.btnAdminUnlock.querySelector('span').textContent = 'Locked';
      dom.btnAdminUnlock.querySelector('svg').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
      calculateEditTotal();
      showToast('All settled input fields are now locked.', 'info');
    } else {
      // Unlock with password
      const password = prompt('Enter Admin Password to Unlock Fields:');
      if (password === '1234') {
        adminOverride = true;
        dom.btnAdminUnlock.classList.remove('locked');
        dom.btnAdminUnlock.classList.add('unlocked');
        dom.btnAdminUnlock.querySelector('span').textContent = 'Unlocked';
        dom.btnAdminUnlock.querySelector('svg').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 0-5-5"/>'; // Open lock path
        calculateEditTotal();
        showToast('Administrative override active! All fields unlocked.', 'success');
      } else if (password !== null) {
        showToast('Invalid password! Access denied.', 'error');
      }
    }
  });

  dom.editBill.addEventListener('input', calculateEditTotal);
  dom.editRd.addEventListener('input', calculateEditTotal);

  // Close Modals
  const closeModal = () => {
    dom.editModal.close();
    tempEditDebits = [];
    editDebitIdToEdit = null;
    tempEditRds = [];
    editRdIdToEdit = null;
    tempEditBank = { account: '', ifsc: '' };
    updateBankSummary('edit');
    adminOverride = false;
    
    // Reset Lock Button UI
    dom.btnAdminUnlock.classList.add('locked');
    dom.btnAdminUnlock.classList.remove('unlocked');
    dom.btnAdminUnlock.querySelector('span').textContent = 'Locked';
    dom.btnAdminUnlock.querySelector('svg').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
    
    renderDebitTable('edit');
    renderRdTable('edit');
    clearErrors(dom.editForm);
  };
  dom.btnModalClose.addEventListener('click', closeModal);
  dom.btnEditCancel.addEventListener('click', closeModal);

  // Handle outside modal click to close
  dom.editModal.addEventListener('click', (e) => {
    if (e.target === dom.editModal) {
      closeModal();
    }
  });

  // Handle Edit Submit
  dom.editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm(dom.editForm)) {
      const id = dom.editId.value;
      const index = ledgerEntries.findIndex(entry => entry.id === id);
      
      if (index !== -1) {
        const billVal = parseFloat(dom.editBill.value) || 0;
        const rdVal = parseFloat(dom.editRd.value) || 0;
        const debitVal = tempEditDebits.reduce((sum, d) => sum + d.amount, 0);
        const rdDetailVal = tempEditRds.reduce((sum, r) => sum + r.amount, 0);
        const debitDateVal = tempEditDebits.length > 0 ? tempEditDebits[tempEditDebits.length - 1].date : '';
        const debitUtrVal = tempEditDebits.map(d => d.utr).filter(u => u !== '').join(', ');

        ledgerEntries[index] = {
          id: id,
          date: dom.editDate.value,
          name: dom.editName.value.trim(),
          firmName: dom.editFirm.value.trim(),
          phone: dom.editPhone.value.trim(),
          coldName: dom.editCold.value.trim(),
          bags: parseInt(dom.editBags.value, 10),
          billAmount: billVal,
          rdAmount: rdVal,
          debitAmount: debitVal,
          rdDetailsAmount: rdDetailVal,
          debits: tempEditDebits,
          rds: tempEditRds,
          debitDate: debitDateVal,
          debitUtr: debitUtrVal,
          bankAccount: tempEditBank.account,
          bankIfsc: tempEditBank.ifsc,
          totalAmount: (billVal - debitVal) + (rdVal - rdDetailVal)
        };

        saveLedgerEntries();
        saveSupabaseEntry(ledgerEntries[index]);
        currentSort = { column: 'date', direction: 'desc' };
        renderApp();
        closeModal();
        showToast('Ledger entry updated successfully!', 'success');
      }
    }
  });
}

function attachUtilityListeners() {
  // Export CSV
  dom.btnExportCsv.addEventListener('click', () => exportToCSV(false));

  // Print PDF / Statement
  dom.btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Bulk Actions - Clear Selection
  dom.btnBulkClear.addEventListener('click', () => {
    selectedEntryIds.clear();
    renderApp();
    showToast('All selections cleared.', 'info');
  });

  // Bulk Actions - Print Selected
  dom.btnBulkPrint.addEventListener('click', () => {
    if (selectedEntryIds.size === 0) return;
    
    const rows = dom.tableRows.querySelectorAll('tr');
    rows.forEach(row => {
      const checkbox = row.querySelector('.entry-checkbox');
      if (checkbox && !checkbox.checked) {
        row.classList.add('print-hidden');
      }
    });

    // Save current dashboard values
    const originalLabel = dom.kpiEntriesLabel.textContent;
    const originalEntriesVal = dom.valTotalEntries.textContent;
    const originalBagsVal = dom.valTotalBags.textContent;
    const originalBillVal = dom.valTotalBill.textContent;
    const originalRdVal = dom.valTotalRd.textContent;
    const originalGrandVal = dom.valGrandTotal.textContent;

    // Calculate selected totals
    const selectedEntries = ledgerEntries.filter(entry => selectedEntryIds.has(entry.id));
    const totalBags = selectedEntries.reduce((sum, e) => sum + e.bags, 0);
    const totalRemainingBill = selectedEntries.reduce((sum, e) => sum + (e.billAmount - e.debitAmount), 0);
    const totalRemainingRd = selectedEntries.reduce((sum, e) => sum + (e.rdAmount - (e.rdDetailsAmount || 0)), 0);
    const totalAmount = selectedEntries.reduce((sum, e) => sum + e.totalAmount, 0);

    // Swap values for printing
    dom.kpiEntriesLabel.textContent = 'Total Selected';
    dom.valTotalEntries.textContent = selectedEntries.length;
    dom.valTotalBags.textContent = totalBags;
    dom.valTotalBill.textContent = formatCurrency(totalRemainingBill);
    dom.valTotalRd.textContent = formatCurrency(totalRemainingRd);
    dom.valGrandTotal.textContent = formatCurrency(totalAmount);

    window.print();

    // Restore original values
    dom.kpiEntriesLabel.textContent = originalLabel;
    dom.valTotalEntries.textContent = originalEntriesVal;
    dom.valTotalBags.textContent = originalBagsVal;
    dom.valTotalBill.textContent = originalBillVal;
    dom.valTotalRd.textContent = originalRdVal;
    dom.valGrandTotal.textContent = originalGrandVal;

    // Cleanup
    rows.forEach(row => row.classList.remove('print-hidden'));
  });

  // Bulk Actions - Export CSV Selected
  dom.btnBulkCsv.addEventListener('click', () => {
    exportToCSV(true);
  });

  // Bulk Actions - Batch Delete Selected
  dom.btnBulkDelete.addEventListener('click', () => {
    const selectedCount = selectedEntryIds.size;
    if (selectedCount === 0) return;

    if (confirm(`Are you sure you want to delete the ${selectedCount} selected ledger entries?`)) {
      const deletedIds = Array.from(selectedEntryIds);
      ledgerEntries = ledgerEntries.filter(entry => !selectedEntryIds.has(entry.id));
      selectedEntryIds.clear();
      saveLedgerEntries();
      deleteSupabaseEntries(deletedIds);
      renderApp();
      showToast(`Successfully deleted ${selectedCount} entries.`, 'success');
    }
  });
}

// --- UI Rendering ---

function renderApp() {
  // Render Calendar Grid
  renderCalendar();

  // Get filtered and sorted records
  const filtered = getFilteredEntries();
  const sorted = getSortedEntries(filtered);

  // Render metrics dashboard using complete list (or filtered? Usually overall dashboard shows complete totals, but we'll show filtered totals if user filtered, so dashboard reflects table stats dynamically. Let's make it reflect the current active filtered records to be highly dynamic, but overall totals if unfiltered).
  updateMetricsDashboard(filtered);

  // Render ledger table rows
  dom.tableRows.innerHTML = '';
  
  if (sorted.length === 0) {
    dom.noRecordsMsg.style.display = 'flex';
    return;
  } else {
    dom.noRecordsMsg.style.display = 'none';
  }

  sorted.forEach(entry => {
    const remainingBill = entry.billAmount - entry.debitAmount;
    const remainingRd = entry.rdAmount - (entry.rdDetailsAmount || 0);
    
    const isLocked = Math.abs(entry.totalAmount) < 0.01;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="text-align: center; vertical-align: middle;"><input type="checkbox" class="entry-checkbox" data-id="${entry.id}" ${selectedEntryIds.has(entry.id) ? 'checked' : ''} style="cursor: pointer; transform: scale(1.15);"></td>
      <td>${formatDisplayDate(entry.date)}</td>
      <td>
        <span class="customer-name-label">${escapeHtml(entry.name)}</span>
        ${entry.firmName ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem; font-weight: 500;">${escapeHtml(entry.firmName)}</div>` : ''}
      </td>
      <td>${escapeHtml(entry.phone || '')}</td>
      <td>${escapeHtml(entry.coldName || '')}</td>
      <td class="numeric">${entry.bags}</td>
      <td class="numeric">${formatCurrency(remainingBill)}</td>
      <td>${entry.debitUtr ? escapeHtml(entry.debitUtr) + (entry.debitDate ? ' (' + formatDisplayDate(entry.debitDate) + ')' : '') : '-'}</td>
      <td class="numeric">${formatCurrency(remainingRd)}</td>
      <td class="numeric td-total">${formatCurrency(entry.totalAmount)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action btn-view-details" data-id="${entry.id}" title="View ledger entry details">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn-action btn-edit ${isLocked ? 'locked-row' : ''}" data-id="${entry.id}" title="${isLocked ? 'Settled & Locked (Requires Admin Password to Edit)' : 'Edit ledger entry'}">
            ${isLocked ? `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            ` : `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            `}
          </button>
          <button class="btn-action btn-delete" data-id="${entry.id}" title="Delete ledger entry">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;

    // Attach row events
    const rowCheckbox = row.querySelector('.entry-checkbox');
    rowCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedEntryIds.add(entry.id);
      } else {
        selectedEntryIds.delete(entry.id);
      }
      updateBulkActionsBar(sorted);
    });

    row.querySelector('.btn-view-details').addEventListener('click', () => openViewDetailsModal(entry.id));
    row.querySelector('.btn-edit').addEventListener('click', () => {
      if (isLocked) {
        const password = prompt('This entry is settled and locked. Enter Admin Password to Edit:');
        if (password === '1234') {
          adminOverride = true;
          openEditModal(entry.id);
        } else if (password !== null) {
          showToast('Invalid password! Access denied.', 'error');
        }
      } else {
        adminOverride = false;
        openEditModal(entry.id);
      }
    });
    row.querySelector('.btn-delete').addEventListener('click', () => deleteEntry(entry.id));

    dom.tableRows.appendChild(row);
  });

  // Sync and update Bulk Actions Bar
  updateBulkActionsBar(sorted);

  // Update Sorting Headers indicator styles
  updateTableHeaderIndicators();
}

function updateMetricsDashboard(entries) {
  const totals = entries.reduce((acc, current) => {
    acc.bags += current.bags;
    acc.bill += (current.billAmount - (current.debitAmount || 0));
    acc.rd += (current.rdAmount - (current.rdDetailsAmount || 0));
    acc.grand += current.totalAmount;
    return acc;
  }, { bags: 0, bill: 0, rd: 0, grand: 0 });

  dom.valTotalEntries.textContent = entries.length;
  dom.valTotalBags.textContent = totals.bags;
  dom.valTotalBill.textContent = formatCurrency(totals.bill);
  dom.valTotalRd.textContent = formatCurrency(totals.rd);
  dom.valGrandTotal.textContent = formatCurrency(totals.grand);
}

function updateTableHeaderIndicators() {
  dom.tableHeaders.forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === currentSort.column) {
      th.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function toggleClearFiltersButton() {
  const hasSearch = dom.searchName.value.trim().length > 0;
  const hasStartDate = dom.filterStartDate.value !== '';
  const hasEndDate = dom.filterEndDate.value !== '';

  if (hasSearch || hasStartDate || hasEndDate) {
    dom.btnClearFilters.style.display = 'inline-block';
  } else {
    dom.btnClearFilters.style.display = 'none';
  }
}

// --- Filter & Sort Calculators ---

function getFilteredEntries() {
  const query = dom.searchName.value.toLowerCase().trim();
  const start = dom.filterStartDate.value;
  const end = dom.filterEndDate.value;

  return ledgerEntries.filter(entry => {
    // Calendar selection filter
    if (selectedCalendarDate && entry.date !== selectedCalendarDate) {
      return false;
    }

    // Search match (name, cold name, or firm name)
    const matchesQuery = entry.name.toLowerCase().includes(query) || 
                         (entry.coldName || '').toLowerCase().includes(query) ||
                         (entry.firmName || '').toLowerCase().includes(query);
    
    // Date match
    let matchesDate = true;
    if (start && entry.date < start) matchesDate = false;
    if (end && entry.date > end) matchesDate = false;

    return matchesQuery && matchesDate;
  });
}

function getSortedEntries(entries) {
  const { column, direction } = currentSort;
  const modifier = direction === 'asc' ? 1 : -1;

  return [...entries].sort((a, b) => {
    let result = 0;
    if (column === 'date') {
      result = a.date.localeCompare(b.date) * modifier;
    } else if (column === 'name') {
      result = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) * modifier;
    } else if (column === 'phone') {
      result = (a.phone || '').localeCompare(b.phone || '') * modifier;
    } else if (column === 'cold') {
      result = (a.coldName || '').localeCompare(b.coldName || '') * modifier;
    } else if (column === 'bags') {
      result = (a.bags - b.bags) * modifier;
    } else if (column === 'bill') {
      const balA = a.billAmount - a.debitAmount;
      const balB = b.billAmount - b.debitAmount;
      result = (balA - balB) * modifier;
    } else if (column === 'utr') {
      result = (a.debitUtr || '').localeCompare(b.debitUtr || '') * modifier;
    } else if (column === 'rd') {
      result = (a.rdAmount - b.rdAmount) * modifier;
    } else if (column === 'total') {
      result = (a.totalAmount - b.totalAmount) * modifier;
    }

    // Tie-breaker: show latest entry on top (newest ID first)
    if (result === 0) {
      return b.id.localeCompare(a.id);
    }
    return result;
  });
}

// --- CRUD Helper Actions ---

function openEditModal(id) {
  const entry = ledgerEntries.find(e => e.id === id);
  if (!entry) return;

  dom.editId.value = entry.id;
  dom.editDate.value = entry.date;
  dom.editName.value = entry.name;
  dom.editFirm.value = entry.firmName || '';
  dom.editPhone.value = entry.phone || '';
  dom.editCold.value = entry.coldName || '';
  dom.editBags.value = entry.bags;
  dom.editBill.value = entry.billAmount;
  dom.editRd.value = entry.rdAmount;

  // Load entry's bank details
  tempEditBank = {
    account: entry.bankAccount || '',
    ifsc: entry.bankIfsc || ''
  };
  updateBankSummary('edit');

  // Load entry's debits list into tempEditDebits state
  if (entry.debits && entry.debits.length > 0) {
    tempEditDebits = entry.debits.map(d => ({ ...d }));
    dom.btnAddDebitEdit.classList.add('active');
  } else if (entry.debitAmount > 0) {
    tempEditDebits = [
      {
        id: 'legacy-' + Date.now(),
        amount: entry.debitAmount,
        date: entry.debitDate || '',
        utr: entry.debitUtr || ''
      }
    ];
    dom.btnAddDebitEdit.classList.add('active');
  } else {
    tempEditDebits = [];
    dom.btnAddDebitEdit.classList.remove('active');
  }

  // Load entry's rds list into tempEditRds state
  if (entry.rds && entry.rds.length > 0) {
    tempEditRds = entry.rds.map(r => ({ ...r }));
    dom.btnAddRdEdit.classList.add('active');
  } else {
    tempEditRds = [];
    dom.btnAddRdEdit.classList.remove('active');
  }

  // Render edit form tables
  renderDebitTable('edit');
  renderRdTable('edit');
  
  // Update totals, balance locks and summaries
  calculateEditTotal();

  dom.editModal.showModal();
}

function deleteEntry(id) {
  const entry = ledgerEntries.find(e => e.id === id);
  if (!entry) return;

  if (confirm(`Are you sure you want to delete the ledger entry for "${entry.name}"?`)) {
    ledgerEntries = ledgerEntries.filter(e => e.id !== id);
    saveLedgerEntries();
    deleteSupabaseEntry(id);
    renderApp();
    showToast('Entry deleted successfully.', 'info');
  }
}

// --- Form Validation Helpers ---

function validateForm(formElement) {
  let isValid = true;
  clearErrors(formElement);

  const inputs = formElement.querySelectorAll('input[required]');
  inputs.forEach(input => {
    const wrapper = input.closest('.input-wrapper');
    const value = input.value.trim();

    if (!value) {
      setError(input, 'This field is required');
      isValid = false;
    } else if (input.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        setError(input, 'Please enter a valid number');
        isValid = false;
      } else if (input.min && num < parseFloat(input.min)) {
        setError(input, `Value must be at least ${input.min}`);
        isValid = false;
      }
    }
  });

  return isValid;
}

function setError(inputElement, errorMessage) {
  const wrapper = inputElement.closest('.input-wrapper');
  if (wrapper) {
    wrapper.classList.add('invalid');
    
    // Add validation text if it doesn't exist
    const group = inputElement.closest('.form-group');
    let errorDiv = group.querySelector('.validation-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error';
      errorDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${errorMessage}</span>
      `;
      group.appendChild(errorDiv);
    }
  }
}

function clearErrors(formElement) {
  formElement.querySelectorAll('.input-wrapper.invalid').forEach(el => {
    el.classList.remove('invalid');
  });
  formElement.querySelectorAll('.validation-error').forEach(el => {
    el.remove();
  });
}

// --- Utility Helpers ---

/**
 * Format raw float numbers into local currency notation (Indian Rupee)
 */
function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `₹ ${formatted}`;
}

/**
 * Clean floating point output format for form textboxes (e.g. "1500.50")
 */
function formatCurrencyNumber(amount) {
  return amount.toFixed(2);
}

/**
 * Format HTML input date (YYYY-MM-DD) into displayable date (DD-MM-YYYY or DD MMM YYYY)
 */
function formatDisplayDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[monthIdx];

  if (!month) return dateString;

  return `${day} ${month} ${year}`;
}

/**
 * Escape HTML input elements to prevent simple XSS injections
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Create dynamic Toast Notifications
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon selector
  let icon = '';
  if (type === 'success') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  dom.toastContainer.appendChild(toast);

  // Dismiss animation trigger after 3s
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

/**
 * Export current list as CSV
 */
function exportToCSV(exportSelected = false) {
  let sorted = [];
  if (exportSelected === true) {
    sorted = ledgerEntries.filter(entry => selectedEntryIds.has(entry.id));
  } else {
    const filtered = getFilteredEntries();
    sorted = getSortedEntries(filtered);
  }

  if (sorted.length === 0) {
    showToast('No entries to export!', 'error');
    return;
  }

  // Define headers
  const csvHeaders = ['Date', 'Customer Name', 'Firm Name', 'Phone', 'Cold Name', 'Bags', 'Bill Balance (Rs)', 'UTR Number', 'RD Balance (Rs)', 'Bank Account', 'Bank IFSC', 'Total Amount (Rs)'];
  
  // Format rows
  const csvRows = sorted.map(entry => [
    entry.date,
    `"${entry.name.replace(/"/g, '""')}"`, // Quote strings and escape existing double quotes
    `"${(entry.firmName || '').replace(/"/g, '""')}"`,
    `"${(entry.phone || '').replace(/"/g, '""')}"`,
    `"${(entry.coldName || '').replace(/"/g, '""')}"`,
    entry.bags,
    (entry.billAmount - entry.debitAmount).toFixed(2),
    `"${(entry.debitUtr || '').replace(/"/g, '""')}"`,
    entry.rdAmount.toFixed(2),
    `"${(entry.bankAccount || '').replace(/"/g, '""')}"`,
    `"${(entry.bankIfsc || '').replace(/"/g, '""')}"`,
    entry.totalAmount.toFixed(2)
  ]);

  // Combine rows into a CSV string
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create Download Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Format today's date for filename
  const fileDate = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `paddulu_ledger_statement_${fileDate}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('CSV statement exported successfully!', 'success');
}

// --- Authentication & Login Flow ---

function initAuthentication() {
  const isSessionLoggedIn = sessionStorage.getItem('paddulu_auth_logged_in') === 'true';
  const isLocalLoggedIn = localStorage.getItem('paddulu_auth_logged_in') === 'true';
  const isRemember = localStorage.getItem('paddulu_auth_remember') === 'true';

  if (isSessionLoggedIn || (isRemember && isLocalLoggedIn)) {
    document.body.classList.add('authenticated');
    // Save session storage status in case it was loaded via localStorage
    if (isRemember && isLocalLoggedIn) {
      sessionStorage.setItem('paddulu_auth_logged_in', 'true');
    }
  } else {
    document.body.classList.remove('authenticated');
  }
}

function isAuthenticated() {
  return document.body.classList.contains('authenticated');
}

function attachAuthListeners() {
  // Toggle password visibility
  dom.btnTogglePassword.addEventListener('click', () => {
    const isPassword = dom.loginPassword.type === 'password';
    dom.loginPassword.type = isPassword ? 'text' : 'password';

    const eyeOpen = dom.btnTogglePassword.querySelector('.eye-open');
    const eyeClosed = dom.btnTogglePassword.querySelector('.eye-closed');

    if (isPassword) {
      eyeOpen.style.display = 'none';
      eyeClosed.style.display = 'block';
    } else {
      eyeOpen.style.display = 'block';
      eyeClosed.style.display = 'none';
    }
  });

  // Handle Login form submit
  dom.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const userIdInput = dom.loginId.value.trim();
    const passwordInput = dom.loginPassword.value;

    // Form inputs validation check
    let isValidInput = true;
    clearErrors(dom.loginForm);

    if (!userIdInput) {
      setError(dom.loginId, 'User ID is required');
      isValidInput = false;
    }
    if (!passwordInput) {
      setError(dom.loginPassword, 'Password is required');
      isValidInput = false;
    }

    if (!isValidInput) {
      triggerLoginShake();
      return;
    }

    // Default Credentials check: User ID "BRT" and Password "1989"
    if (userIdInput === 'BRT' && passwordInput === '1989') {
      // Success auth
      sessionStorage.setItem('paddulu_auth_logged_in', 'true');
      
      if (dom.loginRemember.checked) {
        localStorage.setItem('paddulu_auth_logged_in', 'true');
        localStorage.setItem('paddulu_auth_remember', 'true');
      } else {
        localStorage.removeItem('paddulu_auth_logged_in');
        localStorage.removeItem('paddulu_auth_remember');
      }

      document.body.classList.add('authenticated');
      
      // Load and render app dashboard
      loadLedgerEntries().then(() => {
        renderApp();
      });

      // Show success toast
      showToast('Welcome to Paddulu Ledger. Sign in successful!', 'success');

      // Clear input fields
      dom.loginId.value = '';
      dom.loginPassword.value = '';
      dom.loginRemember.checked = false;
      dom.loginPassword.type = 'password';
      dom.btnTogglePassword.querySelector('.eye-open').style.display = 'block';
      dom.btnTogglePassword.querySelector('.eye-closed').style.display = 'none';
      clearErrors(dom.loginForm);

    } else {
      // Failed auth
      triggerLoginShake();
      showToast('Access Denied: Invalid User ID or Password.', 'error');
    }
  });

  // Handle Logout button click
  dom.btnLogout.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out from Paddulu Ledger?')) {
      // Clear session & localStorage flags
      sessionStorage.removeItem('paddulu_auth_logged_in');
      localStorage.removeItem('paddulu_auth_logged_in');
      localStorage.removeItem('paddulu_auth_remember');

      // Clear layout
      document.body.classList.remove('authenticated');
      
      // Clear forms
      dom.loginForm.reset();
      clearErrors(dom.loginForm);

      showToast('You have been logged out successfully.', 'info');
    }
  });
}

function triggerLoginShake() {
  dom.loginCard.classList.add('shake');
  dom.loginCard.addEventListener('animationend', () => {
    dom.loginCard.classList.remove('shake');
  }, { once: true });
}

// --- Calendar Logic and Event Attachments ---

function attachCalendarListeners() {
  // Navigation Month buttons
  dom.btnPrevMonth.addEventListener('click', () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
    renderCalendar();
  });

  dom.btnNextMonth.addEventListener('click', () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
    renderCalendar();
  });

  // Clear Calendar date filter status bar button
  dom.btnClearCalendarFilter.addEventListener('click', () => {
    selectedCalendarDate = null;
    dom.calendarFilterStatus.style.display = 'none';
    renderApp();
  });
}

function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  // Set the month-year label
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  dom.calendarMonthYear.textContent = `${monthsList[month]} ${year}`;

  // Reset calendar grid days
  dom.calendarDaysGrid.innerHTML = '';

  // Get first day of the month and its weekday index (0-6)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get total days in current month
  const totalDaysCurrentMonth = new Date(year, month + 1, 0).getDate();

  // Get total days in previous month
  const totalDaysPrevMonth = new Date(year, month, 0).getDate();

  // 1. Fill previous month's trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = totalDaysPrevMonth - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="day-number">${dayNum}</span>`;
    dom.calendarDaysGrid.appendChild(cell);
  }

  // Today's details
  const todayStr = new Date().toISOString().split('T')[0];

  // 2. Fill current month's active days
  for (let day = 1; day <= totalDaysCurrentMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const fullDateStr = `${year}-${monthStr}-${dayStr}`;

    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    cell.dataset.date = fullDateStr;

    // Check if cell matches today
    if (fullDateStr === todayStr) {
      cell.classList.add('is-today');
    }

    // Check if cell is currently selected
    if (selectedCalendarDate && fullDateStr === selectedCalendarDate) {
      cell.classList.add('selected-day');
    }

    // Accumulate transaction totals for this day
    const dayTotal = getTransactionsTotalForDate(fullDateStr);
    
    let amountMarkup = '';
    if (dayTotal > 0) {
      cell.classList.add('has-transactions');
      amountMarkup = `<span class="day-amount" title="${formatCurrency(dayTotal)}">${formatCalendarAmount(dayTotal)}</span>`;
    }

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      ${amountMarkup}
    `;

    // Add cell selection click listener
    cell.addEventListener('click', () => {
      if (selectedCalendarDate === fullDateStr) {
        selectedCalendarDate = null;
        dom.calendarFilterStatus.style.display = 'none';
      } else {
        selectedCalendarDate = fullDateStr;
        dom.selectedCalendarDateLabel.textContent = formatDisplayDate(fullDateStr);
        dom.calendarFilterStatus.style.display = 'flex';
      }
      renderApp();
    });

    dom.calendarDaysGrid.appendChild(cell);
  }

  // 3. Fill next month's trailing days (to complete 6-row layout grid = 42 cells)
  const totalCellsUsed = firstDayIndex + totalDaysCurrentMonth;
  const remainingCells = 42 - totalCellsUsed;

  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="day-number">${i}</span>`;
    dom.calendarDaysGrid.appendChild(cell);
  }
}

function getTransactionsTotalForDate(dateString) {
  return ledgerEntries
    .filter(entry => entry.date === dateString)
    .reduce((sum, entry) => sum + entry.totalAmount, 0);
}

function formatCalendarAmount(amount) {
  return formatCurrency(amount);
}

// --- Debit popup Modal Logic and Handlers ---

function attachDebitPopupListeners() {
  // Close / Cancel events
  const closeDebitModal = () => {
    dom.debitModal.close();
    dom.debitPopupForm.reset();
    editDebitIdToEdit = null;
  };
  dom.btnDebitModalClose.addEventListener('click', closeDebitModal);
  dom.btnDebitModalCancel.addEventListener('click', closeDebitModal);

  // Handle outside modal click to close
  dom.debitModal.addEventListener('click', (e) => {
    if (e.target === dom.debitModal) {
      closeDebitModal();
    }
  });

  // Handle form submit inside debit popup
  dom.debitPopupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amountVal = parseFloat(dom.popupDebitAmount.value) || 0;
    const dateVal = dom.popupDebitDate.value;
    const utrVal = dom.popupDebitUtr.value.trim();

    if (amountVal <= 0) {
      showToast('Debit amount must be greater than 0.', 'error');
      return;
    }

    if (editDebitIdToEdit) {
      // Edit existing debit in list
      const idx = tempEditDebits.findIndex(d => d.id === editDebitIdToEdit);
      if (idx !== -1) {
        tempEditDebits[idx].amount = amountVal;
        tempEditDebits[idx].date = dateVal || new Date().toISOString().split('T')[0];
        tempEditDebits[idx].utr = utrVal;
      }
    } else {
      // Add new debit object (+1)
      const debitObject = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
        amount: amountVal,
        date: dateVal || new Date().toISOString().split('T')[0],
        utr: utrVal
      };
      tempEditDebits.push(debitObject);
    }

    if (tempEditDebits.length > 0) {
      dom.btnAddDebitEdit.classList.add('active');
    } else {
      dom.btnAddDebitEdit.classList.remove('active');
    }

    renderDebitTable('edit');

    // Update auto total
    const bill = parseFloat(dom.editBill.value) || 0;
    const rd = parseFloat(dom.editRd.value) || 0;
    const totalDebit = tempEditDebits.reduce((sum, d) => sum + d.amount, 0);
    dom.editTotal.value = formatCurrencyNumber((bill - totalDebit) + rd);
    updateEditDebitSummary();

    dom.debitModal.close();
    dom.debitPopupForm.reset();
    editDebitIdToEdit = null;
    showToast('Debit details saved successfully!', 'success');
  });
}

function openDebitPopup(formType, debitIdToEdit = null) {
  editDebitIdToEdit = debitIdToEdit;
  
  if (debitIdToEdit) {
    const targetDebit = tempEditDebits.find(d => d.id === debitIdToEdit);
    if (targetDebit) {
      dom.popupDebitAmount.value = targetDebit.amount;
      dom.popupDebitDate.value = targetDebit.date;
      dom.popupDebitUtr.value = targetDebit.utr;
    }
  } else {
    dom.debitPopupForm.reset();
    dom.popupDebitDate.value = new Date().toISOString().split('T')[0];
  }

  dom.debitModal.showModal();
}

function renderDebitTable(formType) {
  const container = dom.debitTableEdit;
  const debits = tempEditDebits;

  if (!debits || debits.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    dom.btnAddDebitEdit.classList.remove('active');
    return;
  }

  container.style.display = 'block';

  let rowsHtml = '';
  debits.forEach((debitData, idx) => {
    rowsHtml += `
      <tr>
        <td style="font-weight: bold; text-align: center; color: var(--accent-danger);">${idx + 1}</td>
        <td>${formatCurrency(debitData.amount)}</td>
        <td>${debitData.date ? formatDisplayDate(debitData.date) : '-'}</td>
        <td style="word-break: break-all;">${escapeHtml(debitData.utr || '-')}</td>
        <td style="text-align: center;">
          <div class="mini-actions">
            <button type="button" class="btn-mini-action btn-mini-edit" data-id="${debitData.id}" title="Edit Debit">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button type="button" class="btn-mini-action btn-mini-delete" data-id="${debitData.id}" title="Remove Debit">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <table class="debit-mini-table">
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Debit Amount</th>
          <th>Debit Date</th>
          <th>UTR Number</th>
          <th style="width: 70px; text-align: center;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // Attach row events
  container.querySelectorAll('.btn-mini-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      openDebitPopup('edit', id);
    });
  });

  container.querySelectorAll('.btn-mini-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this debit line item?')) {
        tempEditDebits = tempEditDebits.filter(d => d.id !== id);
        renderDebitTable('edit');
        
        // Recalculate auto totals, locks & summary cards
        calculateEditTotal();
      }
    });
  });
}

function calculateEditTotal() {
  const bill = parseFloat(dom.editBill.value) || 0;
  const rd = parseFloat(dom.editRd.value) || 0;
  const debit = tempEditDebits.reduce((sum, d) => sum + d.amount, 0);
  const rdDetail = tempEditRds.reduce((sum, r) => sum + r.amount, 0);

  const remainingBill = bill - debit;
  const remainingRd = rd - rdDetail;

  dom.editTotal.value = formatCurrencyNumber(remainingBill + remainingRd);

  const isTotalZero = Math.abs(remainingBill + remainingRd) < 0.01;

  if (isTotalZero) {
    dom.btnAdminUnlock.style.display = 'inline-flex';
    if (adminOverride) {
      dom.btnAdminUnlock.classList.remove('locked');
      dom.btnAdminUnlock.classList.add('unlocked');
      dom.btnAdminUnlock.querySelector('span').textContent = 'Unlocked';
      dom.btnAdminUnlock.querySelector('svg').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 0-5-5"/>';
    } else {
      dom.btnAdminUnlock.classList.add('locked');
      dom.btnAdminUnlock.classList.remove('unlocked');
      dom.btnAdminUnlock.querySelector('span').textContent = 'Locked';
      dom.btnAdminUnlock.querySelector('svg').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
    }
  } else {
    dom.btnAdminUnlock.style.display = 'none';
  }

  if (isTotalZero && !adminOverride) {
    dom.editBill.readOnly = true;
    dom.editBill.classList.add('input-disabled');
    dom.btnAddDebitEdit.style.display = 'none';

    dom.editRd.readOnly = true;
    dom.editRd.classList.add('input-disabled');
    dom.btnAddRdEdit.style.display = 'none';

    dom.editName.readOnly = true;
    dom.editName.classList.add('input-disabled');
    dom.editFirm.readOnly = true;
    dom.editFirm.classList.add('input-disabled');
    dom.btnAddBankEdit.style.display = 'none';
    dom.editPhone.readOnly = true;
    dom.editPhone.classList.add('input-disabled');
    dom.editCold.readOnly = true;
    dom.editCold.classList.add('input-disabled');
    dom.editBags.readOnly = true;
    dom.editBags.classList.add('input-disabled');
    dom.editDate.readOnly = true;
    dom.editDate.classList.add('input-disabled');
  } else {
    dom.editBill.readOnly = false;
    dom.editBill.classList.remove('input-disabled');
    dom.btnAddDebitEdit.style.display = 'inline-flex';

    dom.editRd.readOnly = false;
    dom.editRd.classList.remove('input-disabled');
    dom.btnAddRdEdit.style.display = 'inline-flex';

    dom.editName.readOnly = false;
    dom.editName.classList.remove('input-disabled');
    dom.editFirm.readOnly = false;
    dom.editFirm.classList.remove('input-disabled');
    dom.btnAddBankEdit.style.display = 'inline-flex';
    dom.editPhone.readOnly = false;
    dom.editPhone.classList.remove('input-disabled');
    dom.editCold.readOnly = false;
    dom.editCold.classList.remove('input-disabled');
    dom.editBags.readOnly = false;
    dom.editBags.classList.remove('input-disabled');
    dom.editDate.readOnly = false;
    dom.editDate.classList.remove('input-disabled');
  }

  updateEditDebitSummary();
  updateEditRdSummary();
}

function updateEditDebitSummary() {
  const bill = parseFloat(dom.editBill.value) || 0;
  const totalPaid = tempEditDebits.reduce((sum, d) => sum + d.amount, 0);
  const remaining = bill - totalPaid;

  if (tempEditDebits.length === 0) {
    dom.debitSummaryEdit.style.display = 'none';
    return;
  }

  dom.debitSummaryEdit.style.display = 'flex';
  dom.debitSummaryEdit.innerHTML = `
    <span>Bill Balance: <strong>${formatCurrency(bill)}</strong></span>
    <span>Paid: <strong class="highlight-paid">${formatCurrency(totalPaid)}</strong></span>
    <span>Bill Balance: <strong class="highlight-rem">${formatCurrency(remaining)}</strong></span>
  `;
}

// --- RD popup Modal Logic and Handlers ---

function attachRdPopupListeners() {
  // Close / Cancel events
  const closeRdModal = () => {
    dom.rdModal.close();
    dom.rdPopupForm.reset();
    editRdIdToEdit = null;
  };
  dom.btnRdModalClose.addEventListener('click', closeRdModal);
  dom.btnRdModalCancel.addEventListener('click', closeRdModal);

  // Handle outside modal click to close
  dom.rdModal.addEventListener('click', (e) => {
    if (e.target === dom.rdModal) {
      closeRdModal();
    }
  });

  // Handle form submit inside RD popup
  dom.rdPopupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amountVal = parseFloat(dom.popupRdAmount.value) || 0;
    const dateVal = dom.popupRdDate.value;

    if (amountVal <= 0) {
      showToast('RD amount must be greater than 0.', 'error');
      return;
    }

    if (editRdIdToEdit) {
      // Edit existing RD detail
      const idx = tempEditRds.findIndex(r => r.id === editRdIdToEdit);
      if (idx !== -1) {
        tempEditRds[idx].amount = amountVal;
        tempEditRds[idx].date = dateVal || new Date().toISOString().split('T')[0];
      }
    } else {
      // Add new RD detail (+1)
      const rdObject = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
        amount: amountVal,
        date: dateVal || new Date().toISOString().split('T')[0]
      };
      tempEditRds.push(rdObject);
    }

    if (tempEditRds.length > 0) {
      dom.btnAddRdEdit.classList.add('active');
    } else {
      dom.btnAddRdEdit.classList.remove('active');
    }

    renderRdTable('edit');

    // Update edit auto total
    const bill = parseFloat(dom.editBill.value) || 0;
    const rd = parseFloat(dom.editRd.value) || 0;
    const totalDebit = tempEditDebits.reduce((sum, d) => sum + d.amount, 0);
    const totalRdDetail = tempEditRds.reduce((sum, r) => sum + r.amount, 0);
    dom.editTotal.value = formatCurrencyNumber((bill - totalDebit) + (rd - totalRdDetail));
    updateEditRdSummary();

    dom.rdModal.close();
    dom.rdPopupForm.reset();
    editRdIdToEdit = null;
    showToast('RD details saved successfully!', 'success');
  });
}

function openRdPopup(formType, rdIdToEdit = null) {
  editRdIdToEdit = rdIdToEdit;
  
  if (rdIdToEdit) {
    const targetRd = tempEditRds.find(r => r.id === rdIdToEdit);
    if (targetRd) {
      dom.popupRdAmount.value = targetRd.amount;
      dom.popupRdDate.value = targetRd.date;
    }
  } else {
    dom.rdPopupForm.reset();
    dom.popupRdDate.value = new Date().toISOString().split('T')[0];
  }

  dom.rdModal.showModal();
}

function renderRdTable(formType) {
  const container = dom.rdTableEdit;
  const rdsList = tempEditRds;

  if (!rdsList || rdsList.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    dom.btnAddRdEdit.classList.remove('active');
    return;
  }

  container.style.display = 'block';

  let rowsHtml = '';
  rdsList.forEach((rdData, idx) => {
    rowsHtml += `
      <tr>
        <td style="font-weight: bold; text-align: center; color: var(--accent-warning);">${idx + 1}</td>
        <td>${formatCurrency(rdData.amount)}</td>
        <td>${rdData.date ? formatDisplayDate(rdData.date) : '-'}</td>
        <td style="text-align: center;">
          <div class="mini-actions">
            <button type="button" class="btn-mini-action btn-mini-edit" data-id="${rdData.id}" title="Edit RD Detail">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button type="button" class="btn-mini-action btn-mini-delete" data-id="${rdData.id}" title="Remove RD Detail">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <table class="debit-mini-table">
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>RD Amount</th>
          <th>RD Date</th>
          <th style="width: 70px; text-align: center;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // Attach row events
  container.querySelectorAll('.btn-mini-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      openRdPopup('edit', id);
    });
  });

  container.querySelectorAll('.btn-mini-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this RD line item?')) {
        tempEditRds = tempEditRds.filter(r => r.id !== id);
        renderRdTable('edit');
        
        // Recalculate auto totals, locks & summary cards
        calculateEditTotal();
      }
    });
  });
}

function updateEditRdSummary() {
  const rd = parseFloat(dom.editRd.value) || 0;
  const totalPaid = tempEditRds.reduce((sum, r) => sum + r.amount, 0);
  const remaining = rd - totalPaid;

  if (tempEditRds.length === 0) {
    dom.rdSummaryEdit.style.display = 'none';
    return;
  }

  dom.rdSummaryEdit.style.display = 'flex';
  dom.rdSummaryEdit.innerHTML = `
    <span>RD Balance: <strong>${formatCurrency(rd)}</strong></span>
    <span>Paid (RD): <strong class="highlight-paid">${formatCurrency(totalPaid)}</strong></span>
    <span>RD Balance: <strong class="highlight-rem">${formatCurrency(remaining)}</strong></span>
  `;
}

function attachBankModalListeners() {
  // Trigger buttons
  dom.btnAddBankAdd.addEventListener('click', () => {
    openBankPopup('add');
  });

  dom.btnAddBankEdit.addEventListener('click', () => {
    openBankPopup('edit');
  });

  // Close / Cancel events
  const closeBankModal = () => {
    dom.bankModal.close();
    dom.bankPopupForm.reset();
  };
  dom.btnBankModalClose.addEventListener('click', closeBankModal);
  dom.btnBankModalCancel.addEventListener('click', closeBankModal);

  // Handle outside modal click to close
  dom.bankModal.addEventListener('click', (e) => {
    if (e.target === dom.bankModal) {
      closeBankModal();
    }
  });

  // Handle form submit inside Bank popup
  dom.bankPopupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const accountVal = dom.popupBankAccount.value.trim();
    const ifscVal = dom.popupBankIfsc.value.trim().toUpperCase();

    if (activeBankFormType === 'add') {
      tempAddBank = { account: accountVal, ifsc: ifscVal };
      updateBankSummary('add');
    } else {
      tempEditBank = { account: accountVal, ifsc: ifscVal };
      updateBankSummary('edit');
    }

    dom.bankModal.close();
    showToast('Bank details updated successfully!', 'success');
  });
}

function openBankPopup(formType) {
  activeBankFormType = formType;
  
  if (formType === 'add') {
    dom.popupBankAccount.value = tempAddBank.account;
    dom.popupBankIfsc.value = tempAddBank.ifsc;
  } else {
    dom.popupBankAccount.value = tempEditBank.account;
    dom.popupBankIfsc.value = tempEditBank.ifsc;
  }

  dom.bankModal.showModal();
}

function updateBankSummary(formType) {
  const bankData = (formType === 'add') ? tempAddBank : tempEditBank;
  const summaryEl = (formType === 'add') ? dom.bankSummaryAdd : dom.bankSummaryEdit;
  const btnEl = (formType === 'add') ? dom.btnAddBankAdd : dom.btnAddBankEdit;

  if (bankData.account || bankData.ifsc) {
    summaryEl.style.display = 'flex';
    summaryEl.innerHTML = `
      <span>A/C No: <strong>${escapeHtml(bankData.account || '-')}</strong></span>
      <span>IFSC: <strong style="color: var(--accent-info);">${escapeHtml(bankData.ifsc || '-')}</strong></span>
    `;
    btnEl.classList.add('active');
    btnEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Bank Details Added
    `;
    btnEl.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    btnEl.style.background = 'rgba(16, 185, 129, 0.1)';
    btnEl.style.color = 'var(--accent-success)';
  } else {
    summaryEl.style.display = 'none';
    summaryEl.innerHTML = '';
    btnEl.classList.remove('active');
    btnEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      + Add Bank Details
    `;
    btnEl.style.borderColor = 'rgba(14, 165, 233, 0.25)';
    btnEl.style.background = 'rgba(14, 165, 233, 0.12)';
    btnEl.style.color = 'var(--accent-info)';
  }
}

function attachViewDetailsListeners() {
  const closeViewModal = () => {
    dom.viewDetailsModal.close();
    dom.viewDetailsBody.innerHTML = '';
  };
  dom.btnViewClose.addEventListener('click', closeViewModal);
  dom.btnViewCloseFooter.addEventListener('click', closeViewModal);
  dom.viewDetailsModal.addEventListener('click', (e) => {
    if (e.target === dom.viewDetailsModal) {
      closeViewModal();
    }
  });

  dom.btnViewPrint.addEventListener('click', () => {
    // Create portrait style override
    const styleEl = document.createElement('style');
    styleEl.id = 'print-portrait-override';
    styleEl.innerHTML = `@media print { @page { size: portrait !important; margin: 8mm !important; } }`;
    document.head.appendChild(styleEl);

    document.body.classList.add('printing-details');
    window.print();
    document.body.classList.remove('printing-details');

    // Clean up override style
    styleEl.remove();
  });
}

function openViewDetailsModal(id) {
  const entry = ledgerEntries.find(e => e.id === id);
  if (!entry) return;

  const remainingBill = entry.billAmount - entry.debitAmount;
  const remainingRd = entry.rdAmount - (entry.rdDetailsAmount || 0);

  // Build Debits Mini Table HTML
  let debitsHtml = '';
  if (entry.debits && entry.debits.length > 0) {
    let rows = '';
    entry.debits.forEach((d, idx) => {
      rows += `
        <tr>
          <td style="font-weight: bold; text-align: center; color: var(--text-muted);">${idx + 1}</td>
          <td>${formatCurrency(d.amount)}</td>
          <td>${d.date ? formatDisplayDate(d.date) : '-'}</td>
          <td>${d.utr ? escapeHtml(d.utr) : '-'}</td>
        </tr>
      `;
    });
    debitsHtml = `
      <table class="debit-mini-table">
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Debit Amount</th>
            <th>Debit Date</th>
            <th>UTR Number</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } else {
    debitsHtml = `<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">No debit items added to this entry.</div>`;
  }

  // Build RD Details Mini Table HTML
  let rdsHtml = '';
  if (entry.rds && entry.rds.length > 0) {
    let rows = '';
    entry.rds.forEach((r, idx) => {
      rows += `
        <tr>
          <td style="font-weight: bold; text-align: center; color: var(--text-muted);">${idx + 1}</td>
          <td>${formatCurrency(r.amount)}</td>
          <td>${r.date ? formatDisplayDate(r.date) : '-'}</td>
        </tr>
      `;
    });
    rdsHtml = `
      <table class="debit-mini-table">
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>RD Amount</th>
            <th>RD Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } else {
    rdsHtml = `<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">No RD details added to this entry.</div>`;
  }

  dom.viewDetailsBody.innerHTML = `
    <!-- Top General Details Grid -->
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">Customer Name</span>
        <span class="detail-value" style="color: var(--accent-purple); font-size: 1.05rem;">${escapeHtml(entry.name)}</span>
      </div>
      ${entry.firmName ? `
      <div class="detail-item">
        <span class="detail-label">Firm Name</span>
        <span class="detail-value" style="color: var(--accent-info); font-size: 1.05rem; font-weight: 700;">${escapeHtml(entry.firmName)}</span>
      </div>
      ` : ''}
      <div class="detail-item">
        <span class="detail-label">Phone Number</span>
        <span class="detail-value">${escapeHtml(entry.phone || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Cold Storage Name</span>
        <span class="detail-value">${escapeHtml(entry.coldName || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Date of Entry</span>
        <span class="detail-value">${formatDisplayDate(entry.date)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Bags Quantity</span>
        <span class="detail-value">${entry.bags} Bags</span>
      </div>
      ${(entry.bankAccount || entry.bankIfsc) ? `
      <div class="detail-item" style="grid-column: span 2; background: rgba(14, 165, 233, 0.04); border: 1px dashed rgba(14, 165, 233, 0.15); border-radius: 6px; padding: 0.5rem 0.75rem;">
        <span class="detail-label" style="color: var(--accent-info); font-weight: bold; font-size: 0.65rem; text-transform: uppercase;">Bank Account Details</span>
        <div style="display: flex; gap: 1.5rem; margin-top: 0.25rem; flex-wrap: wrap;">
          <span style="font-size: 0.82rem; color: var(--text-primary);">A/C No: <strong>${escapeHtml(entry.bankAccount || '-')}</strong></span>
          <span style="font-size: 0.82rem; color: var(--text-primary);">IFSC: <strong style="color: var(--accent-info);">${escapeHtml(entry.bankIfsc || '-')}</strong></span>
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Bill Balance Section -->
    <div class="detail-section">
      <div class="detail-section-title">
        <span style="font-weight: bold; margin-right: 2px;">₹</span>
        Bill Balance & Debits
      </div>
      ${debitsHtml}
      <div class="detail-summary-bar">
        <span>Gross Bill: <strong>${formatCurrency(entry.billAmount)}</strong></span>
        <span>Paid (Debits): <strong class="highlight-paid">${formatCurrency(entry.debitAmount)}</strong></span>
        <span>Bill Balance: <strong class="highlight-rem">${formatCurrency(remainingBill)}</strong></span>
      </div>
    </div>

    <!-- RD Balance Section -->
    <div class="detail-section">
      <div class="detail-section-title">
        <span style="font-weight: bold; margin-right: 2px;">₹</span>
        RD Balance & Details
      </div>
      ${rdsHtml}
      <div class="detail-summary-bar">
        <span>Gross RD: <strong>${formatCurrency(entry.rdAmount)}</strong></span>
        <span>Paid (RD): <strong class="highlight-paid">${formatCurrency(entry.rdDetailsAmount || 0)}</strong></span>
        <span>RD Balance: <strong class="highlight-rem">${formatCurrency(remainingRd)}</strong></span>
      </div>
    </div>

    <!-- Grand Net Total -->
    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--accent-success); border-radius: 8px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
      <span style="font-family: var(--font-heading); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; color: var(--accent-success);">Grand Net Total</span>
      <span style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--accent-success);">${formatCurrency(entry.totalAmount)}</span>
    </div>
  `;

  dom.viewDetailsModal.showModal();
}

function updateBulkActionsBar(visibleEntries) {
  const selectedCount = selectedEntryIds.size;
  if (selectedCount > 0) {
    dom.bulkActionsBar.style.display = 'flex';
    dom.bulkSelectCount.textContent = `${selectedCount} item${selectedCount > 1 ? 's' : ''} selected`;

    // Calculate totals of selected items
    const selectedEntries = ledgerEntries.filter(entry => selectedEntryIds.has(entry.id));
    const totalBags = selectedEntries.reduce((sum, e) => sum + e.bags, 0);
    const totalRemainingBill = selectedEntries.reduce((sum, e) => sum + (e.billAmount - e.debitAmount), 0);
    const totalRemainingRd = selectedEntries.reduce((sum, e) => sum + (e.rdAmount - (e.rdDetailsAmount || 0)), 0);
    const totalAmount = selectedEntries.reduce((sum, e) => sum + e.totalAmount, 0);

    dom.bulkTotalsSummary.innerHTML = `
      <span style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-purple); font-size: 0.75rem;">Selected Totals:</span>
      <span>Bags: <strong>${totalBags}</strong></span>
      <span>Bill Balance: <strong class="highlight-rem">${formatCurrency(totalRemainingBill)}</strong></span>
      <span>RD Balance: <strong class="highlight-paid">${formatCurrency(totalRemainingRd)}</strong></span>
      <span>Total Amount: <strong class="highlight-total">${formatCurrency(totalAmount)}</strong></span>
    `;
  } else {
    dom.bulkActionsBar.style.display = 'none';
  }

  // Sync Select All checkbox state
  if (visibleEntries.length > 0) {
    const allVisibleSelected = visibleEntries.every(e => selectedEntryIds.has(e.id));
    const noneVisibleSelected = visibleEntries.every(e => !selectedEntryIds.has(e.id));
    dom.selectAllEntries.checked = allVisibleSelected;
    dom.selectAllEntries.indeterminate = !allVisibleSelected && !noneVisibleSelected;
  } else {
    dom.selectAllEntries.checked = false;
    dom.selectAllEntries.indeterminate = false;
  }
}

