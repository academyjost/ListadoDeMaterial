/**
 * ==========================================================================
 * SISTEMA DE MATERIALES - CAPA DE DATOS Y PERSISTENCIA (materiales.js)
 * ==========================================================================
 */

class MaterialesStore {
  constructor() {
    this.STORAGE_KEY = 'listado_materiales_db_v1';
    this.HISTORY_KEY = 'listado_materiales_history_v1';
    this.materiales = [];
    this.history = [];
    this.listeners = [];

    this.init();
  }

  /**
   * Inicializa los datos cargándolos de localStorage o generando datos iniciales de demostración.
   */
  init() {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        this.materiales = JSON.parse(savedData);
      } else {
        // Cargar datos por defecto para una experiencia inicial rica
        this.materiales = this.getInitialSampleData();
        this.save();
      }

      const savedHistory = localStorage.getItem(this.HISTORY_KEY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      } else {
        this.history = [
          {
            id: 'hist_init',
            type: 'system',
            description: 'Sistema inicializado con materiales por defecto',
            timestamp: new Date().toISOString()
          }
        ];
        this.saveHistory();
      }
    } catch (e) {
      console.error('Error al inicializar la base de datos de materiales:', e);
      this.materiales = this.getInitialSampleData();
    }
  }

  /**
   * Genera un conjunto inicial de materiales realistas.
   */
  getInitialSampleData() {
    return [
      {
        id: 'mat_101',
        nombre: 'Cemento Gris 50kg',
        categoria: 'Construcción',
        unidad: 'Cajas',
        stock: 18,
        minStock: 5,
        location: 'Bodega Principal A-1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mat_102',
        nombre: 'Cable Cobre N° 12 (Rollo 100m)',
        categoria: 'Electricidad',
        unidad: 'Rollos',
        stock: 3,
        minStock: 5,
        location: 'Estante Eléctrico B-2',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mat_103',
        nombre: 'Tubo PVC 1/2 pulgada (3 metros)',
        categoria: 'Plomería',
        unidad: 'Unidades',
        stock: 2,
        minStock: 8,
        location: 'Bodega Exterior P-4',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mat_104',
        nombre: 'Pintura Látex Blanca 5 Galones',
        categoria: 'Pinturas',
        unidad: 'Unidades',
        stock: 12,
        minStock: 4,
        location: 'Almacén Pinturas C-3',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mat_105',
        nombre: 'Disco de Corte Metal 4.5"',
        categoria: 'Herramientas',
        unidad: 'Paquetes',
        stock: 25,
        minStock: 10,
        location: 'Caja de Herramientas H-1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mat_106',
        nombre: 'Guantes de Seguridad Cuero',
        categoria: 'General',
        unidad: 'Paquetes',
        stock: 4,
        minStock: 6,
        location: 'Estante de EPP G-1',
        createdAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Guarda los materiales en localStorage y notifica a los suscriptores.
   */
  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.materiales));
      this.notifyListeners();
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  }

  /**
   * Guarda el historial de eventos en localStorage.
   */
  saveHistory() {
    try {
      // Mantener solo los últimos 50 eventos
      if (this.history.length > 50) {
        this.history = this.history.slice(0, 50);
      }
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.error('Error al guardar historial:', e);
    }
  }

  /**
   * Suscribe una función para recibir notificaciones ante cambios en la data.
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Notifica a todos los componentes suscriptos.
   */
  notifyListeners() {
    this.listeners.forEach(cb => cb(this.materiales));
  }

  /**
   * Registra una acción en el historial.
   */
  logHistory(type, description) {
    const entry = {
      id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type,
      description,
      timestamp: new Date().toISOString()
    };
    this.history.unshift(entry);
    this.saveHistory();
  }

  /**
   * Obtiene todos los materiales.
   */
  getAll() {
    return [...this.materiales];
  }

  /**
   * Busca un material por su ID único.
   */
  getById(id) {
    return this.materiales.find(m => m.id === id) || null;
  }

  /**
   * Obtiene materiales con stock igual o inferior al stock mínimo.
   */
  getLowStock() {
    return this.materiales.filter(m => m.stock <= m.minStock);
  }

  /**
   * Obtiene la lista única de categorías.
   */
  getCategories() {
    const cats = new Set(this.materiales.map(m => m.categoria.trim()));
    return Array.from(cats).sort();
  }

  /**
   * Agrega un nuevo material de forma segura, asignándole una clave ID única.
   */
  addMaterial(itemData) {
    // Sanitización y parseo estricto
    const cleanStock = Math.max(0, parseInt(itemData.stock, 10) || 0);
    const cleanMinStock = Math.max(0, parseInt(itemData.minStock, 10) || 0);
    
    const newItem = {
      id: 'mat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      nombre: itemData.nombre.trim(),
      categoria: itemData.categoria.trim() || 'General',
      unidad: itemData.unidad || 'Unidades',
      stock: cleanStock,
      minStock: cleanMinStock,
      location: itemData.location ? itemData.location.trim() : 'Sin ubicación',
      createdAt: new Date().toISOString()
    };

    this.materiales.unshift(newItem);
    this.save();
    this.logHistory('add', `Agregado nuevo material: "${newItem.nombre}" con stock inicial de ${newItem.stock} ${newItem.unidad}.`);

    return newItem;
  }

  /**
   * Actualiza un material existente sin corromper el objeto.
   */
  updateMaterial(id, updatedFields) {
    const index = this.materiales.findIndex(m => m.id === id);
    if (index === -1) return false;

    const oldItem = this.materiales[index];
    
    const cleanStock = Math.max(0, parseInt(updatedFields.stock, 10) || 0);
    const cleanMinStock = Math.max(0, parseInt(updatedFields.minStock, 10) || 0);

    const updatedItem = {
      ...oldItem,
      nombre: updatedFields.nombre.trim(),
      categoria: updatedFields.categoria.trim() || 'General',
      unidad: updatedFields.unidad || 'Unidades',
      stock: cleanStock,
      minStock: cleanMinStock,
      location: updatedFields.location ? updatedFields.location.trim() : 'Sin ubicación',
      updatedAt: new Date().toISOString()
    };

    this.materiales[index] = updatedItem;
    this.save();
    this.logHistory('edit', `Modificado material: "${updatedItem.nombre}". Stock: ${cleanStock}, Mínimo: ${cleanMinStock}.`);

    return updatedItem;
  }

  /**
   * Elimina un material por ID de forma limpia.
   */
  deleteMaterial(id) {
    const index = this.materiales.findIndex(m => m.id === id);
    if (index === -1) return false;

    const deletedItem = this.materiales[index];
    this.materiales.splice(index, 1);
    this.save();
    this.logHistory('delete', `Eliminado material: "${deletedItem.nombre}".`);

    return true;
  }

  /**
   * Ajusta de forma rápida el stock sumando o restando (Delta positivo o negativo).
   * Evita stocks bajo cero o desvariaciones por cadenas/NaN.
   */
  adjustStock(id, delta) {
    const item = this.getById(id);
    if (!item) return false;

    const currentStock = parseInt(item.stock, 10) || 0;
    const change = parseInt(delta, 10) || 0;
    const newStock = Math.max(0, currentStock + change);

    if (newStock === currentStock) return item; // Sin cambio necesario

    item.stock = newStock;
    item.updatedAt = new Date().toISOString();
    this.save();

    const actionType = change > 0 ? 'add' : 'subtract';
    const verb = change > 0 ? 'Aumentado' : 'Disminuido';
    this.logHistory(actionType, `${verb} stock de "${item.nombre}" por ${Math.abs(change)} ${item.unidad}. Nuevo stock: ${newStock}.`);

    return item;
  }

  /**
   * Devuelve el historial completo de actividades.
   */
  getHistoryLog() {
    return [...this.history];
  }
}

// Instancia Global de la tienda de materiales
window.materialesStore = new MaterialesStore();
