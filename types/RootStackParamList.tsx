export type RootStackParamList = {
    Principal: undefined;
    Reportes: undefined;
    IniciarDeteccion: undefined;
    ReporteIndividual: { reporte: Reporte; ubicacion: string };
    Anomalia: { anomalia: Anomalia; reporte: Reporte };
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
  

  export interface Anomalia {
    id: number;
    reporteId: number;
    latitud: number;
    longitud: number;
    minutoDetectado: number;
    estatus: 'pendiente' | 'resuelta' | 'descartado';
  }