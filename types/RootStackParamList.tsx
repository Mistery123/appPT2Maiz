export type RootStackParamList = {
  Principal: undefined;
  Reportes: undefined;
  IniciarDeteccion: undefined;
  ReporteIndividual: { reporte: Reporte; ubicacion: string };
  Anomalia: { anomalia: Anomalia; reporte: Reporte };
  CercaEB: undefined;
  NoCercaEB: undefined;
  AtendiendoAnomalia: { anomalia: Anomalia };
  UAVCercaEB: { anomalia: Anomalia; reporte: Reporte };
  UAVNoCercaEB: { anomalia: Anomalia; reporte: Reporte };
  UGVCercaEB: { anomalia: Anomalia; reporte: Reporte };
  UGVNoCercaEB: { anomalia: Anomalia; reporte: Reporte };
};


export interface Reporte {
  id: number;
  fechaGeneracion: string;
  descripcion: string;
  nombreArchivo: string;
  latitud: number;
  longitud: number;
  estatus: 'pendiente' | 'resuelto' | 'descartado';
}


export type Anomalia = {
  id: number;
  reporteId: number;
  latitud: number;
  longitud: number;
  estatus: string;
  nombreFrame: string;
};
