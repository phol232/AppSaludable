import React, { useState, useEffect } from 'react';
import { useNinosApi } from '../../hooks/useApi';
import CreateChildForm from './CreateChildForm';
import ChildProfileView from './ChildProfileView';
import type { NinoResponse } from '../../types/api';
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
      return `${years} años${months > 0 ? ` y ${months} meses` : ''}`;
    } else {
      return `${months} meses`;
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
          className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
        >
          Agregar niño
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

      {getNinos.data && getNinos.data.length === 0 && !getNinos.loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Aún no has registrado ningún niño
          </div>
          <p className="text-gray-400 mb-6">
            Comienza creando el perfil de un niño para hacer seguimiento de su crecimiento y estado nutricional.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            Registrar primer perfil
          </button>
        </div>
      )}

      {/* Debug: mostrar siempre las tarjetas si hay datos */}
      {getNinos.data && getNinos.data.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mis Niños Registrados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getNinos.data.map((nino: NinoResponse) => (
              <div
                key={nino.nin_id}
                className="rounded-xl border border-emerald-200 bg-white p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 mb-1">{nino.nin_nombres}</h3>
                    <p className="text-sm text-emerald-600">
                      {nino.nin_sexo === 'M' ? 'Masculino' : 'Femenino'} • {calculateAge(nino.nin_fecha_nac)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                      nino.nin_sexo === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}
                  >
                    {nino.nin_sexo === 'M' ? 'M' : 'F'}
                  </span>
                </div>
                
                <dl className="mb-3 space-y-2 text-sm text-emerald-700">
                  <div className="flex justify-between">
                    <dt className="font-semibold">Nacimiento:</dt>
                    <dd>{formatDate(nino.nin_fecha_nac)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-semibold">ID:</dt>
                    <dd>#{nino.nin_id}</dd>
                  </div>
                </dl>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    className="rounded bg-green-400 text-green-900 px-3 py-2 text-sm font-semibold hover:bg-green-500 transition-colors"
                    onClick={() => setSelectedChildId(nino.nin_id)}
                  >
                    Ver perfil
                  </button>
                  <button
                    className="rounded bg-green-400 text-green-900 px-3 py-2 text-sm font-semibold hover:bg-green-500 transition-colors"
                    onClick={() => {/* TODO: abrir modal antropometría */}}
                  >
                    Antropometría
                  </button>
                  <button
                    className="rounded bg-green-400 text-green-900 px-3 py-2 text-sm font-semibold hover:bg-green-500 transition-colors"
                    onClick={() => {/* TODO: abrir modal alergias */}}
                  >
                    Alergias
                  </button>
                  <button
                    className="rounded bg-green-400 text-green-900 px-3 py-2 text-sm font-semibold hover:bg-green-500 transition-colors"
                    onClick={() => {/* TODO: abrir modal entidades */}}
                  >
                    Entidades
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded bg-yellow-300 text-yellow-900 px-3 py-2 text-sm font-semibold hover:bg-yellow-400 transition-colors"
                    onClick={() => {/* TODO: editar niño */}}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded bg-red-300 text-red-900 px-3 py-2 text-sm font-semibold hover:bg-red-400 transition-colors"
                    onClick={() => {/* TODO: eliminar niño */}}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Información adicional */}
      {getNinos.data && getNinos.data.length > 0 && (
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
        <DialogContent className="w-full sm:w-[85vw] md:w-[70vw] lg:w-[60vw] max-w-[900px] my-24 p-0 max-h-[75vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-base font-bold">Registrar nuevo niño</DialogTitle>
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
