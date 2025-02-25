'use client';
import axios from '../plugins/axios';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoSave, IoArrowBackSharp, IoSearchSharp, IoLayersOutline } from "react-icons/io5";
import Swal from '../plugins/alerts';
import { TIPO_CAMBIO_URL, LISTAR_CAMBIO_URL, GUARDAR_TIPO_CAMBIO_URL , ELIMINAR_TIPO_CAMBIO_URL} from '../api/index';
import { TipoDeCambio, HistorialItem } from '@/Interfaces';


export const Tabla: React.FC = () => {
  const [mostrarDatos, setMostrarDatos] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<HistorialItem | null>(null);
  const [initialSelectedItem, setInitialSelectedItem] = useState<{
    exchangeBuy: number;
    exchangeSell: number;
    requestDate: string;
  }>({
    exchangeBuy: 0,
    exchangeSell: 0,
    requestDate: ''
  });

  const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio>({
    requestDate: "",
    exchangeSell: 0,
    exchangeBuy: 0,
  });

  const openModal = (item: HistorialItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  interface SelectedItem {
    id : number ;
    requestDate: string;
    exchangeBuy: number;
    exchangeSell: number;
  }

  interface Response {
    status: number;
  }

  const consultarTipoDeCambio = async () => {
    setLoading(true);
    try {
      const response = await axios.get(TIPO_CAMBIO_URL);
      const { fecha, tipoCambioCompra, tipoCambioVenta } = response.data;
      const fechaFormateada = new Date(fecha).toISOString();

      setTipoDeCambio({
        requestDate: fechaFormateada,
        exchangeSell: tipoCambioCompra
          ? Number(String(tipoCambioCompra).replace(/[₡,]/g, "")) // Asegúrate de convertir a string primero
          : 0,
        exchangeBuy: tipoCambioVenta
          ? Number(String(tipoCambioVenta).replace(/[₡,]/g, "")) // Lo mismo para tipoCambioVenta
          : 0
      });

      setMostrarDatos(true);
    } catch (error) {
      console.error("Error al consultar el tipo de cambio:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarTipoDeCambio = async () => {
    setLoading(true);
    try {
      if (!tipoDeCambio.exchangeSell || !tipoDeCambio.exchangeBuy || !tipoDeCambio.requestDate) {
        Swal.fire({
          title: "Error",
          text: "Los datos del tipo de cambio no están completos.",
          icon: "error",
        });
        setLoading(false);
        return;
      }

      const fechaValida = new Date(tipoDeCambio.requestDate);
      if (isNaN(fechaValida.getTime())) {
        Swal.fire({
          title: "Error",
          text: "La fecha obtenida no es válida.",
          icon: "error",
        });
        setLoading(false);
        return;
      }
      const tipoCambioCompra = Number(tipoDeCambio.exchangeSell);
      const tipoCambioVenta = Number(tipoDeCambio.exchangeBuy);

      if (isNaN(tipoCambioCompra) || isNaN(tipoCambioVenta)) {
        Swal.fire({
          title: "Error",
          text: "Los valores de tipo de cambio son incorrectos.",
          icon: "error",
        });
        setLoading(false);
        return;
      }

      const datosParaEnviar = {
        requestDate: fechaValida.toISOString(),
        exchangeSell: tipoCambioCompra,
        exchangeBuy: tipoCambioVenta,
      };

      const response = await axios.post(GUARDAR_TIPO_CAMBIO_URL, datosParaEnviar, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          title: "Éxito",
          text: response.data.message,
          icon: "success",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: response.data.message || "Hubo un error al guardar el tipo de cambio.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error al guardar el tipo de cambio:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un error desconocido.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const obtenerHistorial = async () => {
    setLoading(true);
    try {
      const response = await axios.get(LISTAR_CAMBIO_URL);
      const historialData: HistorialItem[] = response.data.map((item: any) => ({
        id: item.id,
        requestDate: new Date(item.requestDate).toLocaleDateString('es-CR'),
        exchangeBuy: item.exchangeBuy
          ? new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC'
          }).format(Number(item.exchangeBuy))
          : "N/A",
        exchangeSell: item.exchangeSell
          ? new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC'
          }).format(Number(item.exchangeSell))
          : "N/A"
      }));
      setHistorial(historialData);
      setMostrarHistorial(true);
    } catch (error) {
      console.error("Error al obtener el historial:", error);
    } finally {
      setLoading(false);
    }
  };


  const editarTipoDeCambio = async (selectedItem: SelectedItem, setLoading: (loading: boolean) => void, GUARDAR_TIPO_CAMBIO_URL: string): Promise<void> => {
    setLoading(true);

    try {
      const exchangeBuy = parseFloat(selectedItem.exchangeBuy.toString());
      const exchangeSell = parseFloat(selectedItem.exchangeSell.toString());

      if (
        !selectedItem ||
        !selectedItem.requestDate ||
        isNaN(exchangeBuy) ||
        isNaN(exchangeSell)
      ) {
        Swal.fire({
          title: "Error",
          text: "Por favor, ingresa valores válidos para el tipo de cambio.",
          icon: "error",
        });
        return;
      }

      selectedItem.exchangeBuy = exchangeBuy;
      selectedItem.exchangeSell = exchangeSell;

      const response: Response = await axios.put(GUARDAR_TIPO_CAMBIO_URL, selectedItem, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Éxito",
          text: "Tipo de cambio actualizado correctamente.",
          icon: "success",
        });
      }
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al actualizar el tipo de cambio. Intente nuevamente.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

 
  const eliminarTipoDeCambio = async (id: number): Promise<void> => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el tipo de cambio con ID ${id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
  
    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await axios.delete(`${ELIMINAR_TIPO_CAMBIO_URL}/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.status === 200) {
          Swal.fire({
            title: "Éxito",
            text: response.data.message, 
            icon: "success",
          });
          obtenerHistorial(); 
        } else {

          Swal.fire({
            title: "Error",
            text: response.data.message || 'Hubo un problema al eliminar el tipo de cambio.',
            icon: "error",
          });
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Hubo un problema al eliminar el tipo de cambio';
        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    } else {
      Swal.fire({
        title: "Eliminación Cancelada",
        text: "No se eliminó el tipo de cambio.",
        icon: "info",
      });
    }
  };
  
  useEffect(() => {
    if (selectedItem) {
      setInitialSelectedItem({
        exchangeBuy: selectedItem.exchangeBuy,
        exchangeSell: selectedItem.exchangeSell,
        requestDate: selectedItem.requestDate,
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      consultarTipoDeCambio();
    }
  }, []);

  return (
    <div className="flex-col items-center justify-center w-auto h-auto max-h-[1000px] overflow-auto rounded-3xl shadow-2xl bg-white p-4">
      <div className="flex flex-col items-center justify-center mb-10">
        <h1 className="text-black font-bold text-4xl">Tipo de cambio</h1>
        <p className='text-lg text-gray-600'>Banco Central de Costa Rica</p>
      </div>
      {mostrarDatos && !mostrarHistorial && (
        <motion.div
          className="flex justify-center space-x-6 mt-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className='flex flex-col items-center justify-center'>
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-10 bg-gray-300 w-64 md:w-auto p-6 rounded-lg justify-center items-center">
              <div className="flex flex-col items-center justify-center w-32 h-28 rounded-md bg-gray-200 shadow-md  md:mb-0 hover:bg-gray-400 cursor-pointer">
                <span className="text-black font-semibold text-2xl">Fecha</span>
                <span className="text-black text-center">{tipoDeCambio.requestDate}</span>
              </div>

              <div className="flex flex-col items-center justify-center w-32 h-28 rounded-md bg-gray-200 shadow-md mb-4 md:mb-0 hover:bg-gray-400 cursor-pointer">
                <span className="text-black font-semibold text-2xl">Compra</span>
                <span className="text-black text-center">{tipoDeCambio.exchangeSell}</span>
              </div>

              <div className="flex flex-col items-center justify-center w-32 h-28 rounded-md bg-gray-200 shadow-md mb-4 md:mb-0 hover:bg-gray-400 cursor-pointer">
                <span className="text-black font-semibold text-2xl">Venta</span>
                <span className="text-black text-center">{tipoDeCambio.exchangeBuy}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {mostrarHistorial && (
        <motion.div
          className="bg-gray-100 h-auto p-5 m-5 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl text-black mb-4">Historial Tipos de Cambio</h2>
          <div className="space-y-6 max-h-[400px]  overflow-auto cursor-pointer">
            {historial.map((item, index) => (
            
              <div
                key={index}
                className="flex justify-center items-center space-x-32 bg-gray-200 rounded-lg hover:bg-gray-300 p-3">
                <div className="flex flex-col items-center justify-center w-24 h-28 rounded-md">
                  <span className="text-black font-semibold">Fecha</span>
                  <span className="text-black text-center">{item.requestDate}</span>
                </div>
                <div className="flex flex-col items-center justify-center w-24 h-28 rounded-md">
                  <span className="text-black font-semibold">Compra</span>
                  <span className="text-black text-center">{item.exchangeSell}</span>
                </div>
                <div className="flex flex-col items-center justify-center w-24 h-28 rounded-md">
                  <span className="text-black font-semibold">Venta</span>
                  <span className="text-black text-center">{item.exchangeBuy}</span>
                </div>
                <div className='flex items-center justify-center'>
                  <div className="flex items-center justify-center mt-2 w-full">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-md"
                      onClick={() => openModal(item)}
                    >
                      Modificar
                    </button>
                  </div>
                  <div className="flex items-center justify-center mt-2 ml-5 w-full">
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-md"
                      onClick={() => eliminarTipoDeCambio(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                  </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-6">
            <button
              className="flex items-center justify-center bg-blue-700 w-32 h-10 rounded-md shadow-md text-white hover:bg-blue-800"
              onClick={() => setMostrarHistorial(false)}
            >
              <IoArrowBackSharp className="mx-1" size={18} />
              Regresar
            </button>
          </div>
        </motion.div>
      )}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4 text-black">Modificar Tipo de Cambio</h2>

            <label className="block mb-2">
              <span className="text-black">Fecha:</span>
              <input
                type="text"
                className="w-full p-2 border rounded-md text-black"
                value={selectedItem.requestDate}
                readOnly
              />
            </label>
            <label className="block mb-2">
              <span className="text-black">Compra:</span>
              <input
                type="text"
                maxLength={4}
                className="w-full p-2 border rounded-md text-black"
                value={selectedItem.exchangeSell}
                onChange={(e) =>
                  setSelectedItem({
                    ...selectedItem,
                    exchangeBuy: parseFloat(e.target.value) || 0
                  })
                }
              />
            </label>
            <label className="block mb-4">
              <span className="text-black">Venta:</span>
              <input
                type="text"
                maxLength={4}
                placeholder='¢'
                className="w-full p-2 border rounded-md text-black"
                value={selectedItem.exchangeBuy}
                onChange={(e) =>
                  setSelectedItem({
                    ...selectedItem,
                    exchangeSell: parseFloat(e.target.value) || 0
                  })
                }
              />
            </label>

            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
                onClick={(e) => editarTipoDeCambio(selectedItem, setLoading, GUARDAR_TIPO_CAMBIO_URL)}
                disabled={
                  initialSelectedItem?.exchangeBuy === selectedItem.exchangeBuy &&
                  initialSelectedItem?.exchangeSell === selectedItem.exchangeSell
                }
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-center mt-6">
        {!mostrarHistorial && (
          <button
            className=" flex items-center justify-center bg-green-600 w-32 h-10 rounded-md shadow-md text-white hover:bg-green-700"
            onClick={consultarTipoDeCambio}
            disabled={loading}
          >
            <IoSearchSharp className='mx-1' size={18} />
            {loading ? "Cargando..." : "Consultar"}
          </button>
        )}
        {!mostrarHistorial && (
          <button
            className="flex  items-center  justify-center bg-green-600 w-32 h-10 rounded-md shadow-md text-white hover:bg-green-700 ml-5"
            onClick={guardarTipoDeCambio}
            disabled={loading}
          >
            <IoSave className='mx-1' size={18} />
            {loading ? "Cargando..." : "Guardar"}
          </button>
        )}
      </div>
      {!mostrarHistorial && (
        <div className='flex items-center justify-center mt-5'>
          <button
            className=' flex justify-center items-center bg-blue-600 w-32 h-10 rounded-md shadow-md text-white hover:bg-blue-700'
            onClick={obtenerHistorial}
          >
            <IoLayersOutline className='mx-1' size={18} />
            Ver Historial
          </button>
        </div>
      )}
    </div>
  );
};
