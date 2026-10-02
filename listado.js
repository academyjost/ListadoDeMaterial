/**
 * ==========================================================================
 * SISTEMA DE GESTIÓN DE INVENTARIO - CONTROLADOR DE INTERFAZ (listado.js)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.materialesStore;
  if (!store) {
    console.error('No se encontró el almacén de datos (materialesStore).');
    return;
  }

  // State local de filtros
  let currentSearch = '';
  let currentCategory = 'ALL';
  let currentStatus = 'ALL';
  let deleteTargetId = null;

  // Cache de elementos DOM
  const elements = {
    // Stats
    statTotalItems: document.getElementById('stat-total-items'),
    statTotalUnits: document.getElementById('stat-total-units'),
    statLowStock: document.getElementById('stat-low-stock'),
    badgeNotifications: document.getElementById('badge-notifications'),
    notificationCountBadge: document.getElementById('notification-count-badge'),
    pillLowStockTrigger: document.getElementById('pill-low-stock-trigger'),

    // Navegación
    navButtons: document.querySelectorAll('.nav-btn'),
    dashboardGrid: document.getElementById('dashboard-grid'),
    cardBoxes: document.querySelectorAll('.card-box'),

    // Filtros
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    categoryFilter: document.getElementById('category-filter'),
    statusFilter: document.getElementById('status-filter'),
    btnQuickAdd: document.getElementById('btn-quick-add'),

    // Contenedores principales de cuadros
    inventoryList: document.getElementById('inventory-list'),
    emptyInventory: document.getElementById('empty-inventory'),
    notificationsList: document.getElementById('notifications-list'),
    emptyNotifications: document.getElementById('empty-notifications'),
    tbodyManagement: document.getElementById('tbody-management'),
    mgmtCount: document.getElementById('mgmt-count'),
    historyLogList: document.getElementById('history-log-list'),
    btnExportCsv: document.getElementById('btn-export-csv'),

    // Formulario Agregar
    formAdd: document.getElementById('form-add-material'),
    inputNombre: document.getElementById('input-nombre'),
    inputCategoria: document.getElementById('input-categoria'),
    inputUnidad: document.getElementById('input-unidad'),
    inputStock: document.getElementById('input-stock'),
    inputMinStock: document.getElementById('input-min-stock'),
    inputLocation: document.getElementById('input-location'),
    btnResetForm: document.getElementById('btn-reset-form'),

    // Modal Editar
    modalEdit: document.getElementById('modal-edit'),
    formEdit: document.getElementById('form-edit-material'),
    editId: document.getElementById('edit-id'),
    editNombre: document.getElementById('edit-nombre'),
    editCategoria: document.getElementById('edit-categoria'),
    editUnidad: document.getElementById('edit-unidad'),
    editMinStock: document.getElementById('edit-min-stock'),
    editStock: document.getElementById('edit-stock'),
    editLocation: document.getElementById('edit-location'),
    btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),

    // Modal Eliminar
    modalDelete: document.getElementById('modal-delete'),
    deleteItemName: document.getElementById('delete-item-name'),
    btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // Inicialización de Eventos y Renderizado
  initEvents();
  renderAll();

  // Suscribirse a cambios del almacén de datos
  store.subscribe(() => {
    renderAll();
  });

  /**
   * Registra todos los oyentes de eventos.
   */
  function initEvents() {
    // 1. Navegación por pestañas / cuadros ("Botones para aplastar")
    elements.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        elements.navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (tab === 'all') {
          // Mostrar todos los cuadros
          elements.cardBoxes.forEach(box => {
            box.style.display = 'flex';
          });
        } else {
          // Ocultar los demás y mostrar enfocado
          elements.cardBoxes.forEach(box => {
            const boxId = box.getAttribute('data-box-id');
            if (boxId === tab) {
              box.style.display = 'flex';
              box.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              box.style.display = 'none';
            }
          });
        }
      });
    });

    // 2. Colapsar/Minimizar cuadros individuales ("Aplastarlos")
    document.querySelectorAll('.btn-toggle-box').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const targetBody = document.getElementById(targetId);
        if (targetBody) {
          targetBody.classList.toggle('collapsed-content');
          btn.classList.toggle('collapsed');
        }
      });
    });

    // 3. Filtros y Búsqueda
    elements.searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      elements.btnClearSearch.classList.toggle('visible', currentSearch.length > 0);
      renderInventoryList();
      renderManagementTable();
    });

    elements.btnClearSearch.addEventListener('click', () => {
      elements.searchInput.value = '';
      currentSearch = '';
      elements.btnClearSearch.classList.remove('visible');
      renderInventoryList();
      renderManagementTable();
    });

    elements.categoryFilter.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      renderInventoryList();
      renderManagementTable();
    });

    elements.statusFilter.addEventListener('change', (e) => {
      currentStatus = e.target.value;
      renderInventoryList();
      renderManagementTable();
    });

    // Clic en la píldora superior de Stock Bajo te lleva a las alertas
    elements.pillLowStockTrigger.addEventListener('click', () => {
      const navAlerts = document.querySelector('.nav-btn[data-tab="cuadro-notificaciones"]');
      if (navAlerts) navAlerts.click();
    });

    // Ir al formulario de agregar material
    elements.btnQuickAdd.addEventListener('click', () => {
      const navAdd = document.querySelector('.nav-btn[data-tab="cuadro-gestion"]');
      if (navAdd) navAdd.click();
      elements.inputNombre.focus();
    });

    // 4. Submit de Formulario de Agregar Material
    elements.formAdd.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const itemData = {
        nombre: elements.inputNombre.value,
        categoria: elements.inputCategoria.value,
        unidad: elements.inputUnidad.value,
        stock: elements.inputStock.value,
        minStock: elements.inputMinStock.value,
        location: elements.inputLocation.value
      };

      if (!itemData.nombre || itemData.nombre.trim() === '') {
        showToast('Por favor escribe un nombre válido para el material', 'danger');
        return;
      }

      const created = store.addMaterial(itemData);
      if (created) {
        showToast(`Material "${created.nombre}" agregado con éxito`, 'success');
        elements.formAdd.reset();
        // Restaurar valores por defecto sugeridos
        elements.inputStock.value = '10';
        elements.inputMinStock.value = '5';
      }
    });

    elements.btnResetForm.addEventListener('click', () => {
      elements.formAdd.reset();
      elements.inputStock.value = '10';
      elements.inputMinStock.value = '5';
    });

    // 5. Modal de Edición
    elements.btnCloseEditModal.addEventListener('click', closeEditModal);
    elements.btnCancelEdit.addEventListener('click', closeEditModal);

    elements.formEdit.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = elements.editId.value;
      
      const updatedFields = {
        nombre: elements.editNombre.value,
        categoria: elements.editCategoria.value,
        unidad: elements.editUnidad.value,
        stock: elements.editStock.value,
        minStock: elements.editMinStock.value,
        location: elements.editLocation.value
      };

      const res = store.updateMaterial(id, updatedFields);
      if (res) {
        showToast(`Material "${res.nombre}" actualizado correctamente`, 'info');
        closeEditModal();
      }
    });

    // 6. Modal de Eliminación
    elements.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    elements.btnCancelDelete.addEventListener('click', closeDeleteModal);

    elements.btnConfirmDelete.addEventListener('click', () => {
      if (deleteTargetId) {
        const item = store.getById(deleteTargetId);
        const name = item ? item.nombre : '';
        const ok = store.deleteMaterial(deleteTargetId);
        if (ok) {
          showToast(`Material "${name}" eliminado`, 'danger');
        }
        closeDeleteModal();
      }
    });

    // 7. Exportar CSV
    elements.btnExportCsv.addEventListener('click', exportToCSV);
  }

  /**
   * Renderiza todos los elementos y cuadros.
   */
  function renderAll() {
    renderStats();
    renderCategoriesSelect();
    renderInventoryList();
    renderNotificationsBox();
    renderManagementTable();
    renderHistoryLog();
  }

  /**
   * Renderiza los indicadores numéricos del header y las insignias (badges).
   */
  function renderStats() {
    const all = store.getAll();
    const lowStockItems = store.getLowStock();

    const totalUnits = all.reduce((sum, item) => sum + (parseInt(item.stock, 10) || 0), 0);

    elements.statTotalItems.textContent = all.length;
    elements.statTotalUnits.textContent = totalUnits.toLocaleString();
    elements.statLowStock.textContent = lowStockItems.length;

    elements.badgeNotifications.textContent = lowStockItems.length;
    elements.notificationCountBadge.textContent = `${lowStockItems.length} Alerta${lowStockItems.length !== 1 ? 's' : ''}`;

    if (lowStockItems.length > 0) {
      elements.badgeNotifications.style.display = 'inline-block';
    } else {
      elements.badgeNotifications.style.display = 'inline-block';
      elements.badgeNotifications.style.backgroundColor = 'var(--green-emerald)';
    }
  }

  /**
   * Poblar el selector de categorías dinámicamente preservando la selección del usuario.
   */
  function renderCategoriesSelect() {
    const categories = store.getCategories();
    const currentVal = elements.categoryFilter.value;

    elements.categoryFilter.innerHTML = `<option value="ALL">Todas las Categorías (${categories.length})</option>`;
    
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      elements.categoryFilter.appendChild(opt);
    });

    if (categories.includes(currentVal)) {
      elements.categoryFilter.value = currentVal;
    } else {
      elements.categoryFilter.value = 'ALL';
    }
  }

  /**
   * Obtiene la lista filtrada de materiales según los controles de la UI.
   */
  function getFilteredMateriales() {
    return store.getAll().filter(item => {
      // Filtro de texto
      const matchesSearch = !currentSearch || 
        item.nombre.toLowerCase().includes(currentSearch) ||
        item.categoria.toLowerCase().includes(currentSearch) ||
        (item.location && item.location.toLowerCase().includes(currentSearch));

      // Filtro de categoría
      const matchesCat = currentCategory === 'ALL' || item.categoria === currentCategory;

      // Filtro de estado
      const isLow = item.stock <= item.minStock;
      const matchesStatus = currentStatus === 'ALL' ||
        (currentStatus === 'LOW' && isLow) ||
        (currentStatus === 'OK' && !isLow);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }

  /**
   * CUADRO 1: Renderiza las tarjetas de inventario con botones + y -
   */
  function renderInventoryList() {
    const items = getFilteredMateriales();
    elements.inventoryList.innerHTML = '';

    if (items.length === 0) {
      elements.emptyInventory.classList.remove('hidden');
      return;
    }

    elements.emptyInventory.classList.add('hidden');

    items.forEach(item => {
      const isLow = item.stock <= item.minStock;
      const card = document.createElement('div');
      card.className = `inventory-item-card ${isLow ? 'is-low-stock' : ''}`;

      // Porcentaje de la barra de stock (relativo a minStock * 3)
      const maxVisual = Math.max(item.minStock * 3, 20);
      const percent = Math.min(100, Math.round((item.stock / maxVisual) * 100));

      card.innerHTML = `
        <div class="item-main-info">
          <div class="item-header-row">
            <span class="item-name">${escapeHTML(item.nombre)}</span>
            <span class="category-tag">${escapeHTML(item.categoria)}</span>
          </div>
          <div class="item-meta">
            <span>Ubicación: <strong>${escapeHTML(item.location || 'Sin asignar')}</strong></span>
            <span class="stock-status-badge ${isLow ? 'status-low' : 'status-ok'}">
              ${isLow ? '⚠️ Stock Bajo' : '✓ Stock Suficiente'}
            </span>
          </div>
          <div class="stock-bar-bg" title="Nivel visual de existencias (${item.stock} / min: ${item.minStock})">
            <div class="stock-bar-fill ${isLow ? 'fill-low' : 'fill-ok'}" style="width: ${percent}%;"></div>
          </div>
        </div>

        <div class="stock-control-group">
          <button type="button" class="btn-stock-adjust btn-minus" data-id="${item.id}" data-action="minus" title="Restar 1 unidad (-1)">-</button>
          
          <div class="stock-display-box">
            <span class="stock-number">${item.stock}</span>
            <span class="stock-unit">${escapeHTML(item.unidad)}</span>
          </div>

          <button type="button" class="btn-stock-adjust btn-plus" data-id="${item.id}" data-action="plus" title="Sumar 1 unidad (+1)">+</button>
        </div>
      `;

      // Eventos para botones + y -
      const btnMinus = card.querySelector('[data-action="minus"]');
      const btnPlus = card.querySelector('[data-action="plus"]');

      btnMinus.addEventListener('click', () => {
        const updated = store.adjustStock(item.id, -1);
        if (updated && updated.stock === 0) {
          showToast(`⚠️ Alerta: El stock de "${updated.nombre}" ha llegado a 0.`, 'danger');
        }
      });

      btnPlus.addEventListener('click', () => {
        store.adjustStock(item.id, 1);
      });

      elements.inventoryList.appendChild(card);
    });
  }

  /**
   * CUADRO 2: Renderiza la lista de alertas de stock bajo con botón de reabastecimiento rápido
   */
  function renderNotificationsBox() {
    const lowItems = store.getLowStock();
    elements.notificationsList.innerHTML = '';

    if (lowItems.length === 0) {
      elements.emptyNotifications.classList.remove('hidden');
      return;
    }

    elements.emptyNotifications.classList.add('hidden');

    lowItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'alert-item-card';

      const missing = item.minStock - item.stock;
      const missingText = missing > 0 ? `Faltan ${missing} ${item.unidad} para el mínimo (${item.minStock})` : 'Alcanzó el límite mínimo';

      card.innerHTML = `
        <div class="alert-info">
          <h4>${escapeHTML(item.nombre)}</h4>
          <p class="alert-details">Stock actual: <strong>${item.stock} ${escapeHTML(item.unidad)}</strong> | ${missingText}</p>
        </div>
        <div>
          <button class="btn-restock" data-id="${item.id}" title="Sumar 5 unidades automáticamente">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>+5 ${escapeHTML(item.unidad)}</span>
          </button>
        </div>
      `;

      const btnRestock = card.querySelector('.btn-restock');
      btnRestock.addEventListener('click', () => {
        const updated = store.adjustStock(item.id, 5);
        if (updated) {
          showToast(`Reabastecido "${updated.nombre}" (+5 ${updated.unidad})`, 'success');
        }
      });

      elements.notificationsList.appendChild(card);
    });
  }

  /**
   * CUADRO 3: Renderiza la tabla de gestión de materiales con botones para Editar y Eliminar
   */
  function renderManagementTable() {
    const items = getFilteredMateriales();
    elements.tbodyManagement.innerHTML = '';
    elements.mgmtCount.textContent = `${items.length} producto${items.length !== 1 ? 's' : ''}`;

    if (items.length === 0) {
      elements.tbodyManagement.innerHTML = `
        <tr>
          <td colspan="6" class="text-subtle" style="text-align: center; padding: 2rem;">
            No hay materiales que coincidan con el filtro actual.
          </td>
        </tr>
      `;
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      const isLow = item.stock <= item.minStock;

      tr.innerHTML = `
        <td>
          <strong>${escapeHTML(item.nombre)}</strong>
          <div class="text-subtle" style="font-size: 0.78rem;">${escapeHTML(item.location || 'Sin ubicación')}</div>
        </td>
        <td><span class="category-tag">${escapeHTML(item.categoria)}</span></td>
        <td><strong>${item.stock}</strong> ${escapeHTML(item.unidad)}</td>
        <td>${item.minStock} ${escapeHTML(item.unidad)}</td>
        <td>
          <span class="stock-status-badge ${isLow ? 'status-low' : 'status-ok'}">
            ${isLow ? 'Alerta Bajo' : 'Óptimo'}
          </span>
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button type="button" class="btn-icon-only btn-edit" data-id="${item.id}" title="Editar este material">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="btn-icon-only btn-delete" data-id="${item.id}" title="Eliminar este material">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      `;

      // Evento Editar
      tr.querySelector('.btn-edit').addEventListener('click', () => {
        openEditModal(item);
      });

      // Evento Eliminar
      tr.querySelector('.btn-delete').addEventListener('click', () => {
        openDeleteModal(item);
      });

      elements.tbodyManagement.appendChild(tr);
    });
  }

  /**
   * CUADRO 4: Renderiza el historial de actividades
   */
  function renderHistoryLog() {
    const logs = store.getHistoryLog();
    elements.historyLogList.innerHTML = '';

    if (logs.length === 0) {
      elements.historyLogList.innerHTML = `<li class="text-subtle">No hay registros recientes.</li>`;
      return;
    }

    logs.forEach(log => {
      const li = document.createElement('li');
      li.className = `history-item type-${log.type || 'system'}`;

      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = new Date(log.timestamp).toLocaleDateString();

      li.innerHTML = `
        <span>${escapeHTML(log.description)}</span>
        <span class="history-time" title="${dateStr}">${timeStr}</span>
      `;

      elements.historyLogList.appendChild(li);
    });
  }

  // --- MODAL EDITAR ---
  function openEditModal(item) {
    elements.editId.value = item.id;
    elements.editNombre.value = item.nombre;
    elements.editCategoria.value = item.categoria;
    elements.editUnidad.value = item.unidad;
    elements.editStock.value = item.stock;
    elements.editMinStock.value = item.minStock;
    elements.editLocation.value = item.location || '';

    elements.modalEdit.classList.remove('hidden');
    elements.editNombre.focus();
  }

  function closeEditModal() {
    elements.modalEdit.classList.add('hidden');
    elements.formEdit.reset();
  }

  // --- MODAL ELIMINAR ---
  function openDeleteModal(item) {
    deleteTargetId = item.id;
    elements.deleteItemName.textContent = item.nombre;
    elements.modalDelete.classList.remove('hidden');
  }

  function closeDeleteModal() {
    deleteTargetId = null;
    elements.modalDelete.classList.add('hidden');
  }

  // --- EXPORTAR A CSV ---
  function exportToCSV() {
    const items = store.getAll();
    if (items.length === 0) {
      showToast('No hay datos para exportar', 'danger');
      return;
    }

    const headers = ['ID', 'Nombre', 'Categoria', 'Unidad', 'Stock Actual', 'Stock Minimo', 'Ubicacion'];
    const rows = items.map(i => [
      `"${i.id}"`,
      `"${i.nombre.replace(/"/g, '""')}"`,
      `"${i.categoria.replace(/"/g, '""')}"`,
      `"${i.unidad}"`,
      i.stock,
      i.minStock,
      `"${(i.location || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_materiales_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Archivo CSV generado y descargado', 'success');
  }

  // --- NOTIFICACIONES TOAST ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8.01"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${escapeHTML(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Helper para sanitizar HTML en salidas
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
