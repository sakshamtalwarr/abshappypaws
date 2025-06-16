import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import ConfirmationModal from './components/ConfirmationModal';

const AdminDashboard = ({ db, userId, isAuthReady, appId }) => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: '' });
  const [imageFile, setImageFile] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const storage = getStorage();

useEffect(() => {
  if (!db) {
    console.warn("Firestore not initialized. Skipping product listener.");
    return;
  }

  const productsRef = collection(db, 'products');
  const unsubscribe = onSnapshot(productsRef, (snapshot) => {
    const updatedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(updatedProducts);
  });

  return () => unsubscribe();
}, [db]);

  const openConfirmModal = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const executeConfirmAction = () => {
    if (confirmAction) confirmAction();
    closeConfirmModal();
  };

  const uploadImageAndGetUrl = async (file) => {
    const storageRef = ref(storage, `product-images/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { name, description, price, category } = newProduct;
    if (!name || !description || !price || !category || !imageFile) {
      openConfirmModal('Please fill in all fields and select an image.', null);
      return;
    }
    try {
      const imageUrl = await uploadImageAndGetUrl(imageFile);
      await addDoc(collection(db, 'products'), { ...newProduct, imageUrl });
      setNewProduct({ name: '', description: '', price: '', category: '' });
      setImageFile(null);
      setShowAddForm(false);
    } catch (error) {
      openConfirmModal(`Error adding product: ${error.message}`, null);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.id) return;
    const { name, description, price, imageUrl, category } = editingProduct;
    if (!name || !description || !price || !category) {
      openConfirmModal('Please fill in all fields to edit the product.', null);
      return;
    }
    try {
      let updatedData = { name, description, price, category };
      if (imageFile) {
        updatedData.imageUrl = await uploadImageAndGetUrl(imageFile);
      }
      await setDoc(doc(db, 'products', editingProduct.id), updatedData, { merge: true });
      setEditingProduct(null);
      setImageFile(null);
    } catch (error) {
      openConfirmModal(`Error updating product: ${error.message}`, null);
    }
  };

  const handleDeleteProduct = (id) => {
    openConfirmModal('Are you sure you want to delete this product?', async () => {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        openConfirmModal(`Error deleting product: ${error.message}`, null);
      }
    });
  };

  return (
    <div className="py-12 px-6">
      <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
      <p className="text-gray-600 mb-8">Logged in as: {userId}</p>

      {showAddForm ? (
        <form onSubmit={handleAddProduct} className="space-y-4">
          <input placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input" />
          <input placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input" />
          <input placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="input" />
          <input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="input" />
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="input" />
          <button type="submit" className="btn">Add Product</button>
        </form>
      ) : (
        <button onClick={() => setShowAddForm(true)} className="btn-primary">Add New Product</button>
      )}

      {editingProduct && (
        <form onSubmit={handleEditProduct} className="mt-6 space-y-4">
          <input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="input" />
          <input value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className="input" />
          <input value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} className="input" />
          <input value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="input" />
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="input" />
          <button type="submit" className="btn">Save</button>
          <button type="button" onClick={() => setEditingProduct(null)} className="btn-secondary">Cancel</button>
        </form>
      )}

      <div className="grid gap-4 mt-8">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 shadow rounded">
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p>{product.description}</p>
            <p>₹{product.price}</p>
            <p>Category: {product.category}</p>
            <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover mt-2" />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setEditingProduct(product)} className="btn-sm">Edit</button>
              <button onClick={() => handleDeleteProduct(product.id)} className="btn-sm-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showConfirmModal && (
        <ConfirmationModal message={confirmMessage} onConfirm={executeConfirmAction} onCancel={closeConfirmModal} />
      )}
    </div>
  );
};

export default AdminDashboard;
