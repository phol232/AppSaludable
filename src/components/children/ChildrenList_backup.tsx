import React, { useState, useEffect } from 'react';
import { useNinosApi } from '../../hooks/useApi';
import CreateChildForm from './CreateChildForm';
import ChildProfileView from './ChildProfileView';
import type { NinoWithAnthropometry } from '../../types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const ChildrenList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { getNinos } = useNinosApi();

  useEffect(() => {
    if (!hasInitialized) {
      getNinos.execute();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const handleChildCreated = (childId: number) => {
    setIsCreateModalOpen(false);
    setSelectedChildId(childId);
    getNinos.execute();
  };

  const childProfiles: NinoWithAnthropometry[] = Array.isArray(getNinos.data)
    ? getNinos.data
    : [];
  
  // Extraer los datos del niño de la estructura correcta
  const children = childProfiles.map((profile) => profile);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''}${months > 0 ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    } else {
      return `${months} mes${months === 1 ? '' : 'es'}`;
    }
  };

  // Si se está mostrando el perfil de un niño específico
  if (selectedChildId) {
    return (
      <ChildProfileView 
        childId={selectedChildId}
        onClose={() => setSelectedChildId(null)}
      />
    );
  }

  // Vista principal: lista de niños
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Niños</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          👶 Agregar niño
        </button>
      </div>

      {getNinos.loading && (
        <div className="text-center py-8">
          <div className="text-gray-600">Cargando niños...</div>
        </div>
      )}

      {getNinos.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Error: {getNinos.error}
        </div>
      )}

      {childProfiles.length === 0 && !getNinos.loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Aún no has registrado ningún niño
          </div>
          <p className="text-gray-400 mb-6">
            Comienza creando el perfil de un niño para hacer seguimiento de su crecimiento y estado nutricional.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            👶 Registrar primer perfil
          </button>
        </div>
      )}

      {/* Lista de niños */}
      {childProfiles.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mis Niños Registrados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childProfiles.map((child) => {
              const nino = child.nino;
              const ultimaAntropometria = child.antropometrias && child.antropometrias.length > 0 
                ? child.antropometrias[child.antropometrias.length - 1] 
                : null;
              
              return (
                <div
                  key={nino.nin_id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Layout principal: contenido izquierda, botones derecha */}
                  <div className="flex justify-between items-start">
                    {/* Contenido principal */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold text-white bg-emerald-500">
                          {nino.nin_nombres.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{nino.nin_nombres}</h3>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-bold text-gray-700">Edad:</span> 
                              <span className="text-gray-600 ml-1">{calculateAge(nino.nin_fecha_nac)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-bold text-gray-700">Nacimiento:</span> 
                              <span className="text-gray-600 ml-1">{formatDate(nino.nin_fecha_nac)}</span>
                            </div>
                            {ultimaAntropometria && (
                              <div className="text-sm">
                                <span className="font-bold text-gray-700">Último registro:</span> 
                                <span className="text-gray-600 ml-1">
                                  {ultimaAntropometria.ant_peso_kg} kg • {ultimaAntropometria.ant_talla_cm} cm
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fechas de seguimiento */}
                      <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                        <div className="space-y-1">
                          <div>
                            <span className="font-bold">Actualizado:</span> 19/9/2025
                          </div>
                          <div>
                            <span className="font-bold">Registrado:</span> 17/9/2025
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones verticales a la derecha */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-sm min-w-[100px]"
                        onClick={() => setSelectedChildId(nino.nin_id)}
                      >
                        📊 Análisis
                      </button>
                      <button
                        className="rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-sm min-w-[100px]"
                        onClick={() => {/* TODO: abrir modal antropometría */}}
                      >
                        🖤 Medidas
                      </button>
                      <button
                        className="rounded-lg bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-orange-600 transition-all duration-200 transform hover:scale-105 shadow-sm min-w-[100px]"
                        onClick={() => {/* TODO: abrir modal alergias */}}
                      >
                        🧡 Alergias
                      </button>
                      <button
                        className="rounded-lg bg-blue-500 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 shadow-sm min-w-[100px]"
                        onClick={() => {/* TODO: abrir modal entidades */}}
                      >
                        📋 Entidad
                      </button>
                    </div>
                  </div>
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold text-white ${
                        nino.nin_sexo === 'M' ? 'bg-emerald-500' : 'bg-emerald-500'
                      }`}
                    >
                      {nino.nin_nombres.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{nino.nin_nombres}</h3>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-bold text-gray-700">Edad:</span> 
                          <span className="text-gray-600 ml-1">{calculateAge(nino.nin_fecha_nac)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-bold text-gray-700">Nacimiento:</span> 
                          <span className="text-gray-600 ml-1">{formatDate(nino.nin_fecha_nac)}</span>
                        </div>
                        {ultimaAntropometria && (
                          <div className="text-sm">
                            <span className="font-bold text-gray-700">Último registro:</span> 
                            <span className="text-gray-600 ml-1">
                              {ultimaAntropometria.ant_peso_kg} kg • {ultimaAntropometria.ant_talla_cm} cm
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estado nutricional - Solo si hay datos antropométricos */}
                  {ultimaAntropometria && (
                    <div className="mb-4">
                      <div className="text-sm">
                        <span className="font-bold text-gray-700">Última medición:</span>
                        <span className="ml-1 text-gray-600">
                          {formatDate(ultimaAntropometria.ant_fecha)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fechas de seguimiento - Usando datos disponibles */}
                  <div className="mb-4 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        <span className="font-bold">ID:</span> #{nino.nin_id}
                      </div>
                      {ultimaAntropometria && (
                        <div>
                          <span className="font-bold">Registrado:</span> {formatDate(ultimaAntropometria.ant_fecha)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg bg-emerald-500 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-sm"
                      onClick={() => setSelectedChildId(nino.nin_id)}
                    >
                      📊 Análisis
                    </button>
                    <button
                      className="rounded-lg bg-gray-800 text-white px-3 py-2 text-sm font-semibold hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-sm"
                      onClick={() => {/* TODO: abrir modal antropometría */}}
                    >
                      🖤 Medidas
                    </button>
                    <button
                      className="rounded-lg bg-orange-500 text-white px-3 py-2 text-sm font-semibold hover:bg-orange-600 transition-all duration-200 transform hover:scale-105 shadow-sm"
                      onClick={() => {/* TODO: abrir modal alergias */}}
                    >
                      🧡 Alergias
                    </button>
                    <button
                      className="rounded-lg bg-blue-500 text-white px-3 py-2 text-sm font-semibold hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 shadow-sm"
                      onClick={() => {/* TODO: abrir modal entidades */}}
                    >
                      � Entidad
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Información adicional */}
      {childProfiles.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Consejos:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Haz clic en cualquier tarjeta para ver el perfil completo del niño</li>
            <li>• Puedes agregar nuevas mediciones antropométricas en el perfil</li>
            <li>• El sistema evaluará automáticamente el estado nutricional con cada nueva medición</li>
            <li>• Las recomendaciones se actualizan según las normas de la OMS</li>
          </ul>
        </div>
      )}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[65vw] max-w-[1000px] my-16 p-0 max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-base font-bold text-emerald-900">Registrar nuevo niño</DialogTitle>
          </DialogHeader>
          <CreateChildForm
            onSuccess={handleChildCreated}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChildrenList;
