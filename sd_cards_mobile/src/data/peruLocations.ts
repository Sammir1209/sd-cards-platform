export interface PeruDistrict {
  id: string;
  name: string;
}

export interface PeruProvince {
  id: string;
  name: string;
  districts: string[];
}

export interface PeruDepartment {
  id: string;
  name: string;
  provinces: PeruProvince[];
}

export const PERU_DEPARTMENTS: PeruDepartment[] = [
  {
    id: 'lima',
    name: 'Lima',
    provinces: [
      {
        id: 'lima',
        name: 'Lima',
        districts: [
          'Miraflores',
          'San Isidro',
          'Santiago de Surco',
          'San Borja',
          'Barranco',
          'La Molina',
          'Magdalena del Mar',
          'Pueblo Libre',
          'Jesus Maria',
          'Lince',
          'San Miguel',
          'Surquillo',
          'Cercado de Lima',
          'Los Olivos',
          'Comas',
          'San Martin de Porres',
          'Ate',
          'San Juan de Lurigancho',
          'Chorrillos',
          'Villa El Salvador'
        ]
      },
      {
        id: 'canete',
        name: 'Cañete',
        districts: ['San Vicente de Cañete', 'Asia', 'Mala', 'Cerro Azul', 'Lunahuana']
      },
      {
        id: 'huaral',
        name: 'Huaral',
        districts: ['Huaral', 'Chancay', 'Aucallama']
      }
    ]
  },
  {
    id: 'san_martin',
    name: 'San Martín',
    provinces: [
      {
        id: 'mariscal_caceres',
        name: 'Mariscal Cáceres',
        districts: ['Juanjuí', 'Campanilla', 'Huicungo', 'Pachiza', 'Pajarillo']
      },
      {
        id: 'san_martin',
        name: 'San Martín',
        districts: ['Tarapoto', 'Morales', 'La Banda de Shilcayo', 'Cacatachi', 'Sauce']
      },
      {
        id: 'moyobamba',
        name: 'Moyobamba',
        districts: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantalo']
      },
      {
        id: 'rioja',
        name: 'Rioja',
        districts: ['Rioja', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic']
      },
      {
        id: 'bellavista',
        name: 'Bellavista',
        districts: ['Bellavista', 'San Rafael', 'San Pablo']
      }
    ]
  },
  {
    id: 'arequipa',
    name: 'Arequipa',
    provinces: [
      {
        id: 'arequipa',
        name: 'Arequipa',
        districts: ['Arequipa', 'Yanahuara', 'Cayma', 'Cerro Colorado', 'Jose Luis Bustamante y Rivero', 'Paucarpata']
      },
      {
        id: 'islay',
        name: 'Islay',
        districts: ['Mollendo', 'Cocachacra', 'Mejia']
      }
    ]
  },
  {
    id: 'la_libertad',
    name: 'La Libertad',
    provinces: [
      {
        id: 'trujillo',
        name: 'Trujillo',
        districts: ['Trujillo', 'Victor Larco Herrera', 'Huanchaco', 'Florencia de Mora', 'La Esperanza']
      }
    ]
  },
  {
    id: 'cusco',
    name: 'Cusco',
    provinces: [
      {
        id: 'cusco',
        name: 'Cusco',
        districts: ['Cusco', 'Wanchaq', 'San Sebastian', 'Santiago', 'San Jeronimo']
      },
      {
        id: 'urubamba',
        name: 'Urubamba',
        districts: ['Urubamba', 'Ollantaytambo', 'Machupicchu']
      }
    ]
  },
  {
    id: 'piura',
    name: 'Piura',
    provinces: [
      {
        id: 'piura',
        name: 'Piura',
        districts: ['Piura', 'Castilla', 'Veintiseis de Octubre', 'Catacaos']
      },
      {
        id: 'talara',
        name: 'Talara',
        districts: ['Pariñas', 'Los Organos', 'Mancora']
      }
    ]
  },
  {
    id: 'lambayeque',
    name: 'Lambayeque',
    provinces: [
      {
        id: 'chiclayo',
        name: 'Chiclayo',
        districts: ['Chiclayo', 'La Victoria', 'Pimentel', 'Jose Leonardo Ortiz']
      }
    ]
  },
  {
    id: 'ancash',
    name: 'Áncash',
    provinces: [
      {
        id: 'santa',
        name: 'Santa',
        districts: ['Chimbote', 'Nuevo Chimbote']
      },
      {
        id: 'huaraz',
        name: 'Huaraz',
        districts: ['Huaraz', 'Independencia']
      }
    ]
  },
  {
    id: 'junin',
    name: 'Junín',
    provinces: [
      {
        id: 'huancayo',
        name: 'Huancayo',
        districts: ['Huancayo', 'El Tambo', 'Chilca']
      }
    ]
  },
  {
    id: 'ica',
    name: 'Ica',
    provinces: [
      {
        id: 'ica',
        name: 'Ica',
        districts: ['Ica', 'Parcona', 'Subtanjalla']
      },
      {
        id: 'chincha',
        name: 'Chincha',
        districts: ['Chincha Alta', 'Sunampe']
      },
      {
        id: 'pisco',
        name: 'Pisco',
        districts: ['Pisco', 'Paracas']
      }
    ]
  }
];
