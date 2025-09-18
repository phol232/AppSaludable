import React, { useEffect, useMemo, useState } from 'react';
import AnthropometryManagement from './AnthropometryManagement';
import AllergiesAndEntities from './AllergiesAndEntities';
import {
  useNinosApi,
  useChildProfileApi,
  useAnthropometryApi,
  useNutritionalEvaluationApi,
  useAllergiesApi,
  useEntitiesApi
} from '../hooks/useApi';
import type { NinoResponse, NinoWithAnthropometry, TipoAlergiaResponse } from '../types/api';
import CreateChildForm from './children/CreateChildForm';
import ChildProfileView from './children/ChildProfileView';
import {
  Activity,
  BarChart2,
  Building2,
  HeartPulse,
  MessageCircle,
  Pill,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './ui/dialog';

interface ClinicalSection {
  id: 'anthropometry' | 'allergies-entities';
  title: string;
  icon: string;
  description: string;
}

const CLINICAL_SECTIONS: ClinicalSection[] = [
  {
    id: 'anthropometry',
    title: 'Antropometría',
    icon: '📏',
    description: 'Registro de medidas, historial y evaluación nutricional',
  },
  {
    id: 'allergies-entities',
    title: 'Alergias y Entidades',
    icon: '🏥',
    description: 'Gestión de alergias y asociación con entidades de salud',
  },
];

const SEVERITY_OPTIONS: Array<{ value: 'LEVE' | 'MODERADA' | 'SEVERA'; label: string }> = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADA', label: 'Moderada' },
  { value: 'SEVERA', label: 'Severa' },
];

export default function SelfAnthropometry() {
  const [activeSection, setActiveSection] = useState<ClinicalSection['id']>('anthropometry');
  const [childFlow, setChildFlow] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [isCreateChildModalOpen, setIsCreateChildModalOpen] = useState(false);
  const [isChildProfileOpen, setIsChildProfileOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { getNinos, updateNino } = useNinosApi();
  const { getChildWithData } = useChildProfileApi();
  const { addAnthropometry } = useAnthropometryApi();
  const { evaluateNutritionalStatus } = useNutritionalEvaluationApi();
  const { addAllergy, removeAllergy, getAllergyTypes } = useAllergiesApi();
  const { searchEntities } = useEntitiesApi();

  const [measurementForm, setMeasurementForm] = useState({
    ant_peso_kg: '',
    ant_talla_cm: '',
    ant_fecha: new Date().toISOString().split('T')[0],
  });
  const [addingMeasurement, setAddingMeasurement] = useState(false);
  const [evaluatingStatus, setEvaluatingStatus] = useState(false);
  const [newAllergy, setNewAllergy] = useState<{ ta_codigo: string; severidad: 'LEVE' | 'MODERADA' | 'SEVERA' }>({
    ta_codigo: '',
    severidad: 'LEVE',
  });
  const [allergySearch, setAllergySearch] = useState('');
  const [allergyOptions, setAllergyOptions] = useState<TipoAlergiaResponse[]>([]);
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [removingAllergyId, setRemovingAllergyId] = useState<number | null>(null);
  const [entityQuery, setEntityQuery] = useState('');
  const [entityResults, setEntityResults] = useState<any[]>([]);
  const [selectedEntityResult, setSelectedEntityResult] = useState<any | null>(null);
  const [currentEntity, setCurrentEntity] = useState<any | null>(null);
  const [updatingEntity, setUpdatingEntity] = useState(false);

  const fetchChildDetail = getChildWithData.execute;
  const fetchAllergyCatalog = getAllergyTypes.execute;
  const fetchEntities = searchEntities.execute;

  useEffect(() => {
    getNinos.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Array.isArray(getNinos.data) && getNinos.data.length > 0) {
      setChildFlow('yes');
    }
  }, [getNinos.data]);

  useEffect(() => {
    if (childFlow === 'yes' && Array.isArray(getNinos.data) && getNinos.data.length === 0) {
      setIsCreateChildModalOpen(true);
    } else if (childFlow !== 'yes') {
      setIsCreateChildModalOpen(false);
    }
  }, [childFlow, getNinos.data]);

  const children = useMemo<NinoResponse[]>(() => {
    if (!Array.isArray(getNinos.data)) {
      return [];
    }
    return getNinos.data;
  }, [getNinos.data]);

  useEffect(() => {
    if (childFlow === 'yes' && !isCreateChildModalOpen && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].nin_id);
    }
  }, [childFlow, isCreateChildModalOpen, children, selectedChildId]);

  useEffect(() => {
    if (!selectedChildId) {
      return;
    }
    fetchChildDetail(selectedChildId);
  }, [selectedChildId, fetchChildDetail]);

  useEffect(() => {
    setMeasurementForm({
      ant_peso_kg: '',
      ant_talla_cm: '',
      ant_fecha: new Date().toISOString().split('T')[0],
    });
    setNewAllergy({ ta_codigo: '', severidad: 'LEVE' });
    setAllergySearch('');
    setAllergyOptions([]);
    setEntityQuery('');
    setEntityResults([]);
    setSelectedEntityResult(null);
    if (!selectedChildId) {
      setIsChildProfileOpen(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    if (!allergySearch.trim()) {
      setAllergyOptions([]);
      return;
    }
    const handler = setTimeout(async () => {
      const options = await fetchAllergyCatalog(allergySearch.trim());
      setAllergyOptions(options || []);
    }, 300);
    return () => clearTimeout(handler);
  }, [allergySearch, fetchAllergyCatalog]);

  useEffect(() => {
    if (!entityQuery.trim()) {
      setEntityResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      const results = await fetchEntities(entityQuery.trim());
      setEntityResults(results || []);
    }, 300);
    return () => clearTimeout(handler);
  }, [entityQuery, fetchEntities]);

  useEffect(() => {
    const entId = getChildWithData.data?.nino.ent_id;
    if (!selectedChildId || !entId) {
      setCurrentEntity(null);
      return;
    }
    (async () => {
      const results = await fetchEntities(String(entId));
      const match = results?.find((entity: any) => entity.ent_id === entId) ?? null;
      setCurrentEntity(match);
    })();
  }, [selectedChildId, getChildWithData.data?.nino.ent_id, fetchEntities]);

  const handleSelectFlow = (flow: 'yes' | 'no') => {
    setChildFlow(flow);
    if (flow === 'no') {
      setSelectedChildId(null);
      setIsCreateChildModalOpen(false);
    } else if (flow === 'yes' && children.length === 0) {
      setIsCreateChildModalOpen(true);
    }
  };

  const handleSelectChild = (childId: number) => {
    setSelectedChildId(childId);
    setIsCreateChildModalOpen(false);
  };

  const handleChildCreated = (childId: number) => {
    setIsCreateChildModalOpen(false);
    setSelectedChildId(childId);
    getNinos.execute().then(() => {
      fetchChildDetail(childId);
    });
  };

  const handleMeasurementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedChildId || !measurementForm.ant_peso_kg || !measurementForm.ant_talla_cm) {
      return;
    }

    setAddingMeasurement(true);
    try {
      await addAnthropometry.execute(selectedChildId, {
        ant_peso_kg: parseFloat(measurementForm.ant_peso_kg),
        ant_talla_cm: parseFloat(measurementForm.ant_talla_cm),
        ant_fecha: measurementForm.ant_fecha,
      });
      await evaluateNutritionalStatus.execute(selectedChildId);
      await fetchChildDetail(selectedChildId);
      setMeasurementForm({
        ant_peso_kg: '',
        ant_talla_cm: '',
        ant_fecha: new Date().toISOString().split('T')[0],
      });
    } finally {
      setAddingMeasurement(false);
    }
  };

  const handleEvaluateStatus = async () => {
    if (!selectedChildId) {
      return;
    }
    setEvaluatingStatus(true);
    try {
      await evaluateNutritionalStatus.execute(selectedChildId);
      await fetchChildDetail(selectedChildId);
    } finally {
      setEvaluatingStatus(false);
    }
  };

  const handleAddAllergyClick = async () => {
    if (!selectedChildId || !newAllergy.ta_codigo) {
      return;
    }
    setAddingAllergy(true);
    try {
      await addAllergy.execute(selectedChildId, newAllergy);
      await fetchChildDetail(selectedChildId);
      setNewAllergy({ ta_codigo: '', severidad: 'LEVE' });
      setAllergySearch('');
      setAllergyOptions([]);
    } finally {
      setAddingAllergy(false);
    }
  };

  const handleRemoveAllergyClick = async (allergyId: number) => {
    if (!selectedChildId) {
      return;
    }
    setRemovingAllergyId(allergyId);
    try {
      await removeAllergy.execute(selectedChildId, allergyId);
      await fetchChildDetail(selectedChildId);
    } finally {
      setRemovingAllergyId(null);
    }
  };

  const handleAssignEntity = async () => {
    if (!selectedChildId || !selectedEntityResult) {
      return;
    }
    setUpdatingEntity(true);
    try {
      await updateNino.execute(selectedChildId, { ent_id: selectedEntityResult.ent_id });
      await fetchChildDetail(selectedChildId);
      setCurrentEntity(selectedEntityResult);
      setEntityQuery('');
      setEntityResults([]);
      setSelectedEntityResult(null);
    } finally {
      setUpdatingEntity(false);
    }
  };

  const handleClearEntity = async () => {
    if (!selectedChildId) {
      return;
    }
    setUpdatingEntity(true);
    try {
      await updateNino.execute(selectedChildId, { ent_id: null });
      await fetchChildDetail(selectedChildId);
      setCurrentEntity(null);
    } finally {
      setUpdatingEntity(false);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-ES');
    } catch {
      return iso;
    }
  };

  const describeAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMonths = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''}${months ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mes${months === 1 ? '' : 'es'}`;
  };

  const childDetail = (getChildWithData.data as NinoWithAnthropometry | null) || null;

  const renderFamilyPrompt = () => (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-5 shadow-sm">
      <div className="absolute -top-12 -right-10 h-32 w-32 rounded-full bg-emerald-200 blur-3xl opacity-70" />
      <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
        <MessageCircle className="h-5 w-5 text-white" />
      </div>
      <div className="relative space-y-2">
        <h2 className="text-lg font-semibold text-emerald-900">¿Tienes hijos o menores a tu cargo?</h2>
        <p className="text-sm text-emerald-700 max-w-2xl">
          Activa la gestión familiar para registrar sus datos clínicos y seguir su crecimiento paso a paso. Puedes cambiar esta opción cuando lo necesites.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => handleSelectFlow('yes')}
            className={`flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              childFlow === 'yes'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                : 'bg-emerald-500 text-white shadow hover:bg-emerald-600'
            }`}
          >
            Sí, quiero registrarlos
          </button>
          <button
            type="button"
            onClick={() => handleSelectFlow('no')}
            className={`flex-1 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
              childFlow === 'no'
                ? 'border-emerald-400 bg-white text-emerald-600 shadow-inner'
                : 'border-emerald-200 text-slate-600 hover:border-emerald-300'
            }`}
          >
            No tengo hijos
          </button>
        </div>
      </div>
    </div>
  );

  const renderChildrenSection = () => {
    if (childFlow === 'no') {
      return (
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
              <h3 className="text-base font-semibold text-emerald-800">Sin menores registrados</h3>
              <p className="text-sm text-emerald-700 mt-1 max-w-2xl">
                Cuando quieras comenzar el seguimiento de tus hijos o menores a cargo, activa la gestión familiar y regístralos aquí mismo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectFlow('yes')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
            >
              <Sparkles className="h-4 w-4" /> Registrar hijos ahora
            </button>
          </div>
        </div>
      );
    }

    if (childFlow !== 'yes') {
      return (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-emerald-700">
          Selecciona una de las opciones anteriores para habilitar la gestión de niños.
        </div>
      );
    }

    const renderSelectedChildDetail = () => {
      if (!selectedChildId) {
        return (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center text-sm text-emerald-700">
            Selecciona un niño de la lista para visualizar y gestionar sus datos clínicos.
          </div>
        );
      }

      if (getChildWithData.loading) {
        return (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600">
            Cargando información del niño...
          </div>
        );
      }

      if (getChildWithData.error) {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Error al cargar datos del niño: {getChildWithData.error}
          </div>
        );
      }

      if (!childDetail) {
        return (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-emerald-700">
            No se encontraron datos para este niño.
          </div>
        );
      }

      const latestAnthropometry = childDetail.antropometrias?.[0] ?? null;
      const status = childDetail.ultimo_estado_nutricional || null;

      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
                <h3 className="text-xl font-semibold text-emerald-900">{childDetail.nino.nin_nombres}</h3>
                <p className="text-sm text-emerald-700">
                  Edad: {describeAge(childDetail.nino.nin_fecha_nac)} • Nac. {formatDate(childDetail.nino.nin_fecha_nac)}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                <Activity className="h-4 w-4" /> Última actualización {formatDate(childDetail.nino.actualizado_en || childDetail.nino.nin_fecha_nac)}
              </div>
            </div>
        </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsChildProfileOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-600"
            >
              Ver perfil completo
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-emerald-800">Medición más reciente</div>
                {latestAnthropometry && (
                  <span className="text-xs text-emerald-700">{formatDate(latestAnthropometry.ant_fecha)}</span>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm text-emerald-800">
                {latestAnthropometry ? (
                  <>
                    <div className="flex justify-between">
                      <span>Peso</span>
                      <span className="font-semibold">{latestAnthropometry.ant_peso_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Talla</span>
                      <span className="font-semibold">{latestAnthropometry.ant_talla_cm} cm</span>
                    </div>
                    {latestAnthropometry.imc && (
                      <div className="flex justify-between">
                        <span>IMC</span>
                        <span className="font-semibold">{Number(latestAnthropometry.imc).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-emerald-700">Aún no se han registrado mediciones para este niño.</p>
        )}
      </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-indigo-800">Estado nutricional</div>
                <button
                  type="button"
                  onClick={handleEvaluateStatus}
                  disabled={evaluatingStatus}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
                >
                  {evaluatingStatus ? 'Calculando…' : 'Recalcular'}
                </button>
              </div>
              <div className="mt-4 space-y-2 text-sm text-indigo-900">
                {status ? (
                  <>
                    <div className="flex justify-between">
                      <span>Clasificación</span>
                      <span className="font-semibold uppercase">{status.classification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IMC</span>
                      <span className="font-semibold">{status.imc.toFixed(2)}</span>
                    </div>
                    {status.percentile && (
                      <div className="flex justify-between">
                        <span>Percentil</span>
                        <span className="font-semibold">{status.percentile.toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Nivel de riesgo</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        status.risk_level === 'ALTO'
                          ? 'bg-red-100 text-red-700'
                          : status.risk_level === 'MODERADO'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {status.risk_level}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-indigo-700">Registra una medición para calcular el estado nutricional.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-emerald-900">Registrar nueva medición</div>
            </div>
            <form onSubmit={handleMeasurementSubmit} className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-emerald-600 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="200"
                  value={measurementForm.ant_peso_kg}
                  onChange={(e) => setMeasurementForm(prev => ({ ...prev, ant_peso_kg: e.target.value }))}
                  className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-emerald-600 mb-1">Talla (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={measurementForm.ant_talla_cm}
                  onChange={(e) => setMeasurementForm(prev => ({ ...prev, ant_talla_cm: e.target.value }))}
                  className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={measurementForm.ant_fecha}
                  onChange={(e) => setMeasurementForm(prev => ({ ...prev, ant_fecha: e.target.value }))}
                  className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={addingMeasurement || !measurementForm.ant_peso_kg || !measurementForm.ant_talla_cm}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50"
                >
                  <HeartPulse className="h-4 w-4" /> {addingMeasurement ? 'Guardando…' : 'Guardar medida'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <BarChart2 className="h-4 w-4" /> Historial reciente
              </div>
            </div>
            {childDetail.antropometrias && childDetail.antropometrias.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-right">Peso (kg)</th>
                      <th className="px-4 py-2 text-right">Talla (cm)</th>
                      <th className="px-4 py-2 text-right">IMC</th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {childDetail.antropometrias.slice(0, 5).map((ant) => (
                      <tr key={ant.ant_id}>
                        <td className="px-4 py-2 text-left text-gray-700">{formatDate(ant.ant_fecha)}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{ant.ant_peso_kg}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{ant.ant_talla_cm}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{ant.imc ? Number(ant.imc).toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">Sin registros antropométricos todavía.</p>
        )}
      </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Pill className="h-4 w-4" /> Alergias activas
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {childDetail.alergias && childDetail.alergias.length > 0 ? (
                  childDetail.alergias.map((alergia) => (
                    <span
                      key={alergia.na_id}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow"
                    >
                      {alergia.ta_nombre} ({alergia.na_severidad})
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergyClick(alergia.na_id)}
                        disabled={removingAllergyId === alergia.na_id}
                        className="text-emerald-500 hover:text-emerald-700"
                        aria-label="Eliminar alergia"
                      >
                        {removingAllergyId === alergia.na_id ? '…' : '×'}
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700">No hay alergias registradas.</span>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1">Buscar alergia</label>
          <input
                    value={allergySearch}
                    onChange={(e) => {
                      setAllergySearch(e.target.value);
                      setNewAllergy(prev => ({ ...prev, ta_codigo: '' }));
                    }}
                    placeholder="Nombre o código"
                    className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                  {allergySearch && allergyOptions.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-emerald-100 bg-white shadow">
                      {allergyOptions.slice(0, 8).map((option) => (
                        <button
                          key={option.ta_codigo}
                          type="button"
                          onClick={() => {
                            setAllergySearch(option.ta_nombre);
                            setNewAllergy(prev => ({ ...prev, ta_codigo: option.ta_codigo }));
                            setAllergyOptions([]);
                          }}
                          className="w-full border-b border-emerald-50 px-3 py-2 text-left text-sm hover:bg-emerald-50 last:border-b-0"
                        >
                          <div className="font-medium text-emerald-800">{option.ta_nombre}</div>
                          <div className="text-xs text-emerald-500">{option.ta_categoria}</div>
                  </button>
                      ))}
            </div>
          )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 mb-1">Código</label>
                    <input
                      value={newAllergy.ta_codigo}
                      onChange={(e) => setNewAllergy(prev => ({ ...prev, ta_codigo: e.target.value }))}
                      className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Ej: LC01"
                    />
        </div>
        <div>
                    <label className="block text-xs font-semibold text-emerald-600 mb-1">Severidad</label>
          <select
                      value={newAllergy.severidad}
                      onChange={(e) => setNewAllergy(prev => ({ ...prev, severidad: e.target.value as any }))}
                      className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    >
                      {SEVERITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
            ))}
          </select>
        </div>
        </div>
          <button
                  type="button"
                  onClick={handleAddAllergyClick}
                  disabled={addingAllergy || !newAllergy.ta_codigo}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" /> {addingAllergy ? 'Guardando…' : 'Agregar alergia'}
          </button>
        </div>
      </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Building2 className="h-4 w-4" /> Entidad de seguimiento
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-sky-800">
                {currentEntity ? (
                  <div className="rounded-lg border border-sky-100 bg-white p-4">
                    <div className="font-semibold text-sky-900">{currentEntity.ent_nombre}</div>
                    <div className="text-xs text-sky-600">
                      {[currentEntity.ent_distrito, currentEntity.ent_provincia, currentEntity.ent_departamento]
                        .filter(Boolean)
                        .join(', ') || 'Sin ubicación especificada'}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearEntity}
                      disabled={updatingEntity}
                      className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-800 disabled:opacity-50"
                    >
                      {updatingEntity ? 'Quitando…' : 'Desasociar entidad'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700">No hay una entidad asociada actualmente.</p>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1">Buscar entidad</label>
                  <input
                    value={entityQuery}
                    onChange={(e) => {
                      setEntityQuery(e.target.value);
                      setSelectedEntityResult(null);
                    }}
                    placeholder="Nombre o código"
                    className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                  {entityQuery && entityResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-emerald-100 bg-white shadow">
                      {entityResults.map((entity: any) => (
                        <button
                          key={entity.ent_id}
                          type="button"
                          onClick={() => {
                            setSelectedEntityResult(entity);
                            setEntityQuery(entity.ent_nombre);
                            setEntityResults([]);
                          }}
                          className="w-full border-b border-emerald-50 px-3 py-2 text-left text-sm hover:bg-emerald-50 last:border-b-0"
                        >
                          <div className="font-medium text-emerald-900">{entity.ent_nombre}</div>
                          <div className="text-xs text-emerald-600">
                            {[entity.ent_distrito, entity.ent_provincia].filter(Boolean).join(', ') || 'Sin ubicación'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={updatingEntity || !selectedEntityResult}
                  onClick={handleAssignEntity}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50"
                >
                  {updatingEntity ? 'Asociando…' : 'Asociar entidad'}
                </button>
              </div>
            </div>
      </div>
    </div>
      );
    };

    return (
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsCreateChildModalOpen(true)}
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            <PlusCircle className="h-4 w-4" /> Registrar nuevo hijo
          </button>
          <div className="space-y-3">
            {children.length === 0 && !isCreateChildModalOpen && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-center text-xs text-emerald-700">
                No has registrado niños todavía.
              </div>
            )}
            {children.map((child) => {
                const isActive = selectedChildId === child.nin_id;
                return (
                  <button
                    key={child.nin_id}
                    type="button"
                    onClick={() => handleSelectChild(child.nin_id)}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow'
                        : 'bg-white text-emerald-800 border border-transparent hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{child.nin_nombres}</span>
                      <span className="text-xs text-emerald-600">{describeAge(child.nin_fecha_nac)}</span>
                    </div>
                    <div className="mt-1 text-xs text-emerald-500">Actualizado {formatDate(child.actualizado_en)}</div>
                  </button>
                );
              })}
            </div>
        </div>
      </aside>
      <section>{renderSelectedChildDetail()}</section>
    </div>
    );
  };

  const renderPersonalSection = () => (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tus datos clínicos</h2>
          <p className="text-sm text-gray-600">Registra tus propias medidas y obtén recomendaciones personalizadas.</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {CLINICAL_SECTIONS.map((section) => (
          <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`${
                  activeSection === section.id
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 py-4 px-6 border-b-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <span className="text-xl">{section.icon}</span>
                <span>{section.title}</span>
          </button>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{CLINICAL_SECTIONS.find(s => s.id === activeSection)?.icon}</span>
            <div>
              <h2 className="text-lg font-medium text-green-900">{CLINICAL_SECTIONS.find(s => s.id === activeSection)?.title}</h2>
              <p className="text-green-700 text-sm">{CLINICAL_SECTIONS.find(s => s.id === activeSection)?.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeSection === 'anthropometry' ? <AnthropometryManagement /> : <AllergiesAndEntities />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {renderFamilyPrompt()}
        {renderChildrenSection()}
        {renderPersonalSection()}
      </div>

      <Dialog open={isCreateChildModalOpen} onOpenChange={setIsCreateChildModalOpen}>
        <DialogContent className="w-full sm:w-[88vw] md:w-[68vw] lg:w-[56vw] max-w-[920px] my-20 max-h-[78vh] overflow-y-auto border-none p-0 rounded-3xl">
          <div className="flex flex-col gap-5 p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-semibold text-emerald-900">Registrar nuevo niño</DialogTitle>
            </DialogHeader>
            <CreateChildForm
              onSuccess={(childId) => {
                handleChildCreated(childId);
              }}
              onCancel={() => setIsCreateChildModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(isChildProfileOpen && selectedChildId)} onOpenChange={setIsChildProfileOpen}>
        <DialogContent className="md:max-w-4xl w-full my-16 max-h-[85vh] overflow-y-auto border-none p-0 rounded-2xl">
          <div className="p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-semibold text-emerald-900">Perfil completo del niño</DialogTitle>
            </DialogHeader>
            {selectedChildId && (
              <ChildProfileView
                childId={selectedChildId}
                onClose={() => setIsChildProfileOpen(false)}
              />
            )}
  </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
