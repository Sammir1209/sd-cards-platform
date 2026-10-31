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
    id: 'amazonas',
    name: 'Amazonas',
    provinces: [
      {
        id: 'chachapoyas',
        name: 'Chachapoyas',
        districts: ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquin', 'Chuquibamba', 'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena', 'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca', 'San Francisco de Daguas', 'San Isidro de Maino', 'Soloco', 'Sonche']
      },
      {
        id: 'bagua',
        name: 'Bagua',
        districts: ['Bagua', 'Aramango', 'Copallin', 'El Parco', 'Imaza', 'La Peca']
      },
      {
        id: 'bongara',
        name: 'Bongará',
        districts: ['Jumbilla', 'Chisquilla', 'Churuja', 'Corosha', 'Cuispes', 'Florida', 'Jazan', 'Recta', 'San Carlos', 'Shipasbamba', 'Valera', 'Yambrasbamba']
      },
      {
        id: 'condorcanqui',
        name: 'Condorcanqui',
        districts: ['Nieva', 'El Cenepa', 'Río Santiago']
      },
      {
        id: 'luya',
        name: 'Luya',
        districts: ['Lamud', 'Camporredondo', 'Cocabamba', 'Colcamar', 'Conila', 'Inguilpata', 'Longuita', 'Lonya Chico', 'Luya', 'Luya Viejo', 'María', 'Ocalli', 'Ocumal', 'Pisuquia', 'Providencia', 'San Cristóbal', 'San Francisco del Yeso', 'San Jerónimo', 'San Juan de Lopecancha', 'Santa Catalina', 'Santo Tomas', 'Tingo', 'Trita']
      },
      {
        id: 'rodriguez_de_mendoza',
        name: 'Rodríguez de Mendoza',
        districts: ['San Nicolás', 'Chirimoto', 'Cochamal', 'Huambo', 'Limabamba', 'Longar', 'Mariscal Benavides', 'Milpuc', 'Omia', 'Santa Rosa', 'Totora', 'Vista Alegre']
      },
      {
        id: 'utcubamba',
        name: 'Utcubamba',
        districts: ['Bagua Grande', 'Cajaruro', 'Cumba', 'El Milagro', 'Jamalca', 'Lonya Grande', 'Yamon']
      }
    ]
  },
  {
    id: 'ancash',
    name: 'Áncash',
    provinces: [
      {
        id: 'huaraz',
        name: 'Huaraz',
        districts: ['Huaraz', 'Cochabamba', 'Colcabamba', 'Huanchay', 'Independencia', 'Jangas', 'La Libertad', 'Olleros', 'Pampas Grande', 'Pariacoto', 'Pira', 'Tarica']
      },
      {
        id: 'santa',
        name: 'Santa',
        districts: ['Chimbote', 'Cáceres del Perú', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Nuevo Chimbote', 'Samanco', 'Santa']
      },
      {
        id: 'casma',
        name: 'Casma',
        districts: ['Casma', 'Buena Vista Alta', 'Comandante Noel', 'Yaután']
      },
      {
        id: 'huarmey',
        name: 'Huarmey',
        districts: ['Huarmey', 'Cochapeti', 'Culebras', 'Huayan', 'Malvas']
      },
      {
        id: 'huari',
        name: 'Huari',
        districts: ['Huari', 'Anra', 'Cajay', 'Chavín de Huántar', 'Huacachi', 'Huacchis', 'Huachis', 'Huantar', 'Masin', 'Paucas', 'Pontó', 'Rahuapampa', 'Rapayan', 'San Marcos', 'San Pedro de Chana', 'Uco']
      },
      {
        id: 'huaylas',
        name: 'Huaylas',
        districts: ['Caraz', 'Huallanca', 'Huata', 'Huaylas', 'Mato', 'Pamparomás', 'Pueblo Libre', 'Santa Cruz', 'Santo Toribio', 'Yuracmarca']
      },
      {
        id: 'yungay',
        name: 'Yungay',
        districts: ['Yungay', 'Cascapara', 'Mancos', 'Matacoto', 'Quillo', 'Ranrahirca', 'Shupluy', 'Yanama']
      }
    ]
  },
  {
    id: 'apurimac',
    name: 'Apurímac',
    provinces: [
      {
        id: 'abancay',
        name: 'Abancay',
        districts: ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'San Pedro de Cachora', 'Tamburco']
      },
      {
        id: 'andahuaylas',
        name: 'Andahuaylas',
        districts: ['Andahuaylas', 'Andarapa', 'Chiara', 'Huancarama', 'Huancaray', 'Huayana', 'Kishuara', 'Pacobamba', 'Pacucha', 'Pampachiri', 'Pomacocha', 'San Antonio de Cachi', 'San Jerónimo', 'San Miguel de Chaccrampa', 'Santa María de Chicmo', 'Talavera', 'Tumay Huaraca', 'Turpo', 'Kaquiabamba', 'José María Arguedas']
      },
      {
        id: 'antabamba',
        name: 'Antabamba',
        districts: ['Antabamba', 'El Oro', 'Huaquirca', 'Juan Espinoza Medrano', 'Oropesa', 'Pachaconas', 'Sabaino']
      },
      {
        id: 'aymaraes',
        name: 'Aymaraes',
        districts: ['Chalhuanca', 'Capaya', 'Caraybamba', 'Chapimarca', 'Colcabamba', 'Cotaruse', 'Ihuayllo', 'Justo Apu Sahuaraura', 'Lucre', 'Pocohuanca', 'San Juan de Chacña', 'Sañayca', 'Soraya', 'Tapairihua', 'Tintay', 'Toraya', 'Yanaca']
      },
      {
        id: 'cotabambas',
        name: 'Cotabambas',
        districts: ['Tambobamba', 'Cotabambas', 'Coyllurqui', 'Haquira', 'Mara', 'Challhuahuacho']
      },
      {
        id: 'chincheros',
        name: 'Chincheros',
        districts: ['Chincheros', 'Anco_Huallo', 'Cocharcas', 'Huaccana', 'Ocobamba', 'Ongoy', 'Uranmarca', 'Ranracancha', 'Rocchacc', 'El Porvenir', 'Los Chankas']
      },
      {
        id: 'grau',
        name: 'Grau',
        districts: ['Chuquibambilla', 'Curpahuasi', 'Gamarra', 'Huayllati', 'Mamara', 'Micaela Bastidas', 'Pataypampa', 'Progreso', 'San Antonio', 'Santa Rosa', 'Turpay', 'Vilcabamba', 'Virundo', 'Curasco']
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
        districts: [
          'Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandia', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura', 'José Luis Bustamante y Rivero'
        ]
      },
      {
        id: 'camana',
        name: 'Camaná',
        districts: ['Camaná', 'José María Quimper', 'Mariano Nicolás Valcárcel', 'Mariscal Cáceres', 'Nicolás de Pierola', 'Ocoña', 'Quilca', 'Samuel Pastor']
      },
      {
        id: 'caraveli',
        name: 'Caravelí',
        districts: ['Caravelí', 'Acarí', 'Atico', 'Atiquipa', 'Bella Unión', 'Cahuacho', 'Chala', 'Chaparra', 'Huanuhuanu', 'Jaqui', 'Lomas', 'Quicacha', 'Yauca']
      },
      {
        id: 'castilla',
        name: 'Castilla',
        districts: ['Aplao', 'Andagua', 'Ayo', 'Chachas', 'Chilcaymarca', 'Choco', 'Huancarqui', 'Machaguay', 'Orcopampa', 'Pampacolca', 'Tipan', 'Uñon', 'Uraca', 'Viraco']
      },
      {
        id: 'caylloma',
        name: 'Caylloma',
        districts: ['Chivay', 'Achoma', 'Cabanaconde', 'Callalli', 'Caylloma', 'Coporaque', 'Huambo', 'Huanca', 'Ichupampa', 'Lari', 'Lluta', 'Maca', 'Madrigal', 'San Antonio de Chuca', 'Sibayo', 'Tapay', 'Tisco', 'Tuti', 'Yanque', 'Majes']
      },
      {
        id: 'condesuyos',
        name: 'Condesuyos',
        districts: ['Chuquibamba', 'Andaray', 'Cayarani', 'Chichas', 'Iray', 'Río Grande', 'Salamanca', 'Yanaquihua']
      },
      {
        id: 'islay',
        name: 'Islay',
        districts: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón']
      },
      {
        id: 'la_union',
        name: 'La Unión',
        districts: ['Cotahuasi', 'Alca', 'Charcana', 'Huaynacotas', 'Pampamarca', 'Puyca', 'Quechualla', 'Sayla', 'Tauria', 'Tomepampa', 'Toro']
      }
    ]
  },
  {
    id: 'ayacucho',
    name: 'Ayacucho',
    provinces: [
      {
        id: 'huamanga',
        name: 'Huamanga',
        districts: ['Ayacucho', 'Acocro', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Jesús Nazareno', 'Ocros', 'Pacaycasa', 'Quinua', 'San José de Ticllas', 'San Juan Bautista', 'Santiago de Pischa', 'Socos', 'Tambillo', 'Vinchos', 'Andrés Avelino Cáceres Dorregaray']
      },
      {
        id: 'cangallo',
        name: 'Cangallo',
        districts: ['Cangallo', 'Chuschi', 'Los Morochucos', 'María Parado de Bellido', 'Paras', 'Totos']
      },
      {
        id: 'huanta',
        name: 'Huanta',
        districts: ['Huanta', 'Ayahuanco', 'Huamanguilla', 'Iguain', 'Luricocha', 'Santillana', 'Sivia', 'Llochegua', 'Canayre', 'Uchuraccay', 'Pucacolpa', 'Chaca']
      },
      {
        id: 'huanca_sancos',
        name: 'Huanca Sancos',
        districts: ['Sancos', 'Carapo', 'Sacsamarca', 'Santiago de Lucanamarca']
      },
      {
        id: 'la_mar',
        name: 'La Mar',
        districts: ['San Miguel', 'Anco', 'Ayna', 'Chilcas', 'Chungui', 'Luis Carranza', 'Santa Rosa', 'Samugari', 'Anchihuay', 'Oronccoy']
      },
      {
        id: 'lucanas',
        name: 'Lucanas',
        districts: ['Puquio', 'Aucara', 'Cabana', 'Carmen Salcedo', 'Chaviña', 'Chipao', 'Huac-Huas', 'Laramate', 'Leoncio Prado', 'Llauta', 'Lucanas', 'Ocaña', 'Otoca', 'Saisa', 'San Cristóbal', 'San Juan', 'San Pedro', 'San Pedro de Palco', 'Sancos', 'Santa Ana de Huaycahuacho', 'Santa Lucía']
      },
      {
        id: 'parinacochas',
        name: 'Parinacochas',
        districts: ['Coracora', 'Chumpi', 'Coronel Castañeda', 'Pacapausa', 'Pullo', 'Puyusca', 'San Francisco de Ravacayco', 'Upahuacho']
      },
      {
        id: 'paucar_del_sara_sara',
        name: 'Páucar del Sara Sara',
        districts: ['Pausa', 'Colta', 'Corculla', 'Lampa', 'Marcabamba', 'Oyolo', 'Pararca', 'San Javier de Alpabamba', 'San José de Ushua', 'Sara Sara']
      },
      {
        id: 'sucre',
        name: 'Sucre',
        districts: ['Querobamba', 'Belén', 'Chalcos', 'Chilcayoc', 'Huacaña', 'Morcolla', 'Paico', 'San Pedro de Larcay', 'San Salvador de Quije', 'Santiago de Paucaray', 'Soras']
      },
      {
        id: 'victor_fajardo',
        name: 'Víctor Fajardo',
        districts: ['Huancapi', 'Alcamenca', 'Apongo', 'Asquipata', 'Canaria', 'Cayara', 'Colca', 'Huamanquiquia', 'Huancaraylla', 'Huaya', 'Sarhua', 'Vilcanchos']
      },
      {
        id: 'vilcas_huaman',
        name: 'Vilcas Huamán',
        districts: ['Vilcas Huamán', 'Accomarca', 'Carhuanca', 'Concepción', 'Huambalpa', 'Independencia', 'Saurama', 'Vischongo']
      }
    ]
  },
  {
    id: 'cajamarca',
    name: 'Cajamarca',
    provinces: [
      {
        id: 'cajamarca',
        name: 'Cajamarca',
        districts: ['Cajamarca', 'Asunción', 'Chetilla', 'Cospán', 'Encañada', 'Jesús', 'Llacanora', 'Los Baños del Inca', 'Magdalena', 'Matara', 'Namora', 'San Juan']
      },
      {
        id: 'cajabamba',
        name: 'Cajabamba',
        districts: ['Cajabamba', 'Cachachi', 'Condebamba', 'Sitacocha']
      },
      {
        id: 'celendin',
        name: 'Celendín',
        districts: ['Celendín', 'Chumuch', 'Cortegana', 'Huasmin', 'Jorge Chávez', 'José Gálvez', 'Miguel Iglesias', 'Oxamarca', 'Sorochuco', 'Sucre', 'Utco', 'La Libertad de Pallán']
      },
      {
        id: 'chota',
        name: 'Chota',
        districts: ['Chota', 'Anguia', 'Chadin', 'Chiguirip', 'Chimban', 'Choropampa', 'Cochabamba', 'Conchan', 'Huambos', 'Lajas', 'Llama', 'Miracosta', 'Paccha', 'Pion', 'Querocoto', 'San Juan de Licupis', 'Tacabamba', 'Tocmoche', 'Chalamarca']
      },
      {
        id: 'contumaza',
        name: 'Contumazá',
        districts: ['Contumazá', 'Chilete', 'Cupisnique', 'Guzmango', 'San Benito', 'Santa Cruz de Toledo', 'Tantarica', 'Yonan']
      },
      {
        id: 'cutervo',
        name: 'Cutervo',
        districts: ['Cutervo', 'Callayuc', 'Choros', 'Cujillo', 'La Ramada', 'Pimpingos', 'Querocotillo', 'San Andrés de Cutervo', 'San Juan de Cutervo', 'San Luis de Lucma', 'Santa Cruz', 'Santo Domingo de la Capilla', 'Santo Tomas', 'Socota', 'Toribio Casanova']
      },
      {
        id: 'hualgayoc',
        name: 'Hualgayoc',
        districts: ['Bambamarca', 'Chugur', 'Hualgayoc']
      },
      {
        id: 'jaen',
        name: 'Jaén',
        districts: ['Jaén', 'Bellavista', 'Chontali', 'Colasay', 'Huabal', 'Las Pirias', 'Pomahuaca', 'Pucara', 'Sallique', 'San Felipe', 'San José del Alto', 'Santa Rosa']
      },
      {
        id: 'san_ignacio',
        name: 'San Ignacio',
        districts: ['San Ignacio', 'Chirinos', 'Huarango', 'La Coipa', 'Namballe', 'San José de Lourdes', 'Tabaconas']
      },
      {
        id: 'san_marcos',
        name: 'San Marcos',
        districts: ['Pedro Gálvez', 'Chancay', 'Eduardo Villanueva', 'Gregorio Pita', 'Ichocan', 'José Manuel Quiroz', 'José Sabogal']
      },
      {
        id: 'san_miguel',
        name: 'San Miguel',
        districts: ['San Miguel', 'Bolívar', 'Calquis', 'Catilluc', 'El Prado', 'La Florida', 'Llapa', 'Nanchoc', 'Niepos', 'San Gregorio', 'San Silvestre de Cochan', 'Tongod', 'Unión Agua Blanca']
      },
      {
        id: 'san_pablo',
        name: 'San Pablo',
        districts: ['San Pablo', 'San Bernardino', 'San Luis', 'Tumbaden']
      },
      {
        id: 'santa_cruz',
        name: 'Santa Cruz',
        districts: ['Santa Cruz', 'Andabamba', 'Catache', 'Chancaybaños', 'La Esperanza', 'Ninabamba', 'Pulan', 'Saucepampa', 'Sexi', 'Uticyacu', 'Yauyucan']
      }
    ]
  },
  {
    id: 'callao',
    name: 'Callao',
    provinces: [
      {
        id: 'callao',
        name: 'Callao',
        districts: [
          'Callao',
          'Bellavista',
          'Carmen de la Legua Reynoso',
          'La Perla',
          'La Punta',
          'Ventanilla',
          'Mi Perú'
        ]
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
        districts: ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq']
      },
      {
        id: 'acomayo',
        name: 'Acomayo',
        districts: ['Acomayo', 'Acopia', 'Acos', 'Mosoc Llacta', 'Pomacanchi', 'Rondocan', 'Sangarará']
      },
      {
        id: 'anta',
        name: 'Anta',
        districts: ['Anta', 'Ancahuasi', 'Cachimayo', 'Chinchaypujio', 'Huarocondo', 'Limatambo', 'Mollepata', 'Pucyura', 'Zurite']
      },
      {
        id: 'calca',
        name: 'Calca',
        districts: ['Calca', 'Coya', 'Lamay', 'Lares', 'Písac', 'San Salvador', 'Taray', 'Yanatile']
      },
      {
        id: 'canas',
        name: 'Canas',
        districts: ['Yanaoca', 'Checca', 'Kunturkanki', 'Langui', 'Layo', 'Pampamarca', 'Quehue', 'Tupac Amaru']
      },
      {
        id: 'canchis',
        name: 'Canchis',
        districts: ['Sicuani', 'Checacupe', 'Combapata', 'Marangani', 'Pitumarca', 'San Pablo', 'San Pedro', 'Tinta']
      },
      {
        id: 'chumbivilcas',
        name: 'Chumbivilcas',
        districts: ['Santo Tomás', 'Capacmarca', 'Chamaca', 'Colquemarca', 'Livitaca', 'Llusco', 'Quiñota', 'Velille']
      },
      {
        id: 'espinar',
        name: 'Espinar',
        districts: ['Espinar', 'Condoroma', 'Coporaque', 'Ocoruro', 'Pallpata', 'Pichigua', 'Suyckutambo', 'Alto Pichigua']
      },
      {
        id: 'la_convencion',
        name: 'La Convención',
        districts: ['Santa Ana', 'Echarate', 'Huayopata', 'Maranura', 'Ocobamba', 'Quellouno', 'Kimbiri', 'Santa Teresa', 'Vilcabamba', 'Pichari', 'Inkawasi', 'Villa Virgen', 'Villa Kintiarina', 'Megantoni']
      },
      {
        id: 'paruro',
        name: 'Paruro',
        districts: ['Paruro', 'Accha', 'Ccapi', 'Colcha', 'Huanoquite', 'Omacha', 'Paccaritambo', 'Pillpinto', 'Yaurisque']
      },
      {
        id: 'paucartambo',
        name: 'Paucartambo',
        districts: ['Paucartambo', 'Caicay', 'Challabamba', 'Colquepata', 'Huancarani', 'Kosñipata']
      },
      {
        id: 'quispicanchi',
        name: 'Quispicanchi',
        districts: ['Urcos', 'Andahuaylillas', 'Camanti', 'Ccarhuayo', 'Ccatca', 'Cusipata', 'Huaro', 'Lucre', 'Marcapata', 'Ocongate', 'Oropesa', 'Quiquijana']
      },
      {
        id: 'urubamba',
        name: 'Urubamba',
        districts: ['Urubamba', 'Chinchero', 'Huayllabamba', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Yucay']
      }
    ]
  },
  {
    id: 'huancavelica',
    name: 'Huancavelica',
    provinces: [
      {
        id: 'huancavelica',
        name: 'Huancavelica',
        districts: ['Huancavelica', 'Acobambilla', 'Acoria', 'Conayca', 'Cuenca', 'Huachocolpa', 'Huayllahuara', 'Izcuchaca', 'Laria', 'Manta', 'Mariscal Cáceres', 'Moya', 'Nuevo Occoro', 'Palca', 'Pilchaca', 'Vilca', 'Yauli', 'Ascensión']
      },
      {
        id: 'acobamba',
        name: 'Acobamba',
        districts: ['Acobamba', 'Andabamba', 'Anta', 'Caja', 'Marcas', 'Paucará', 'Pomacocha', 'Rosario']
      },
      {
        id: 'angaraes',
        name: 'Angaraes',
        districts: ['Lircay', 'Anchonga', 'Callanmarca', 'Ccochaccasa', 'Chincho', 'Congalla', 'Doblado', 'Huanca-Huanca', 'Huayllay Grande', 'Julcamarca', 'San Antonio de Antaparco', 'Santo Tomás de Pata', 'Secclla']
      },
      {
        id: 'castrovirreyna',
        name: 'Castrovirreyna',
        districts: ['Castrovirreyna', 'Arma', 'Aurahua', 'Capillas', 'Chupamarca', 'Cocas', 'Huachos', 'Huamatambo', 'Mollepampa', 'San Juan', 'Santa Ana', 'Tantara', 'Ticrapo']
      },
      {
        id: 'churcampa',
        name: 'Churcampa',
        districts: ['Churcampa', 'Anco', 'Chinchihuasi', 'El Carmen', 'La Merced', 'Locroja', 'Paucarbamba', 'San Miguel de Mayocc', 'San Pedro de Coris', 'Pachamarca', 'Cosme']
      },
      {
        id: 'huaytara',
        name: 'Huaytará',
        districts: ['Huaytará', 'Ayaví', 'Córdova', 'Huayacundo Arma', 'Laramarca', 'Ocoyo', 'Pilpichaca', 'Querco', 'Quito-Arma', 'San Antonio de Cusicancha', 'San Francisco de Sangayaico', 'San Isidro', 'Santiago de Chocorvos', 'Santiago de Quirahuara', 'Santo Domingo de Capillas', 'Tambo']
      },
      {
        id: 'tayacaja',
        name: 'Tayacaja',
        districts: ['Pampas', 'Acostambo', 'Acraquia', 'Ahuaycha', 'Colcabamba', 'Daniel Hernández', 'Huachocolpa', 'Huaribamba', 'Ñahuimpuquio', 'Pazos', 'Quishuar', 'Salcabamba', 'Salcahuasi', 'San Marcos de Rocchac', 'Surcubamba', 'Tintay Puncu', 'Quichuas', 'Andaymarca', 'Roble', 'Pichos', 'Santiago de Tucuma']
      }
    ]
  },
  {
    id: 'huanuco',
    name: 'Huánuco',
    provinces: [
      {
        id: 'huanuco',
        name: 'Huánuco',
        districts: ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Quisqui', 'San Francisco de Cayrán', 'San Pedro de Chaulán', 'Santa María del Valle', 'Yarumayo', 'Pillco Marca', 'Yacus', 'San Pablo de Pillao']
      },
      {
        id: 'ambo',
        name: 'Ambo',
        districts: ['Ambo', 'Cayna', 'Colpas', 'Conchamarca', 'Huácar', 'San Francisco', 'San Rafael', 'Tomay Kichwa']
      },
      {
        id: 'dos_de_mayo',
        name: 'Dos de Mayo',
        districts: ['La Unión', 'Chuquis', 'Marías', 'Pachas', 'Quivilla', 'Ripán', 'Shunqui', 'Sillapata', 'Yanas']
      },
      {
        id: 'huacaybamba',
        name: 'Huacaybamba',
        districts: ['Huacaybamba', 'Canchabamba', 'Cochabamba', 'Pinra']
      },
      {
        id: 'huamalies',
        name: 'Huamalíes',
        districts: ['Llata', 'Arancay', 'Chavín de Pariarca', 'Jacas Grande', 'Jircan', 'Miraflores', 'Monzón', 'Punchao', 'Puños', 'Singa', 'Tantamayo']
      },
      {
        id: 'leoncio_prado',
        name: 'Leoncio Prado',
        districts: ['Rupa-Rupa', 'Daniel Alomía Robles', 'Hermilio Valdizán', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraún', 'Pucayacu', 'Castillo Grande', 'Pueblo Nuevo', 'Santo Domingo de Anda']
      },
      {
        id: 'maranon',
        name: 'Marañón',
        districts: ['Huacrachuco', 'Cholón', 'San Buenaventura', 'La Morada', 'Santa Rosa de Alto Yanajanca']
      },
      {
        id: 'pachitea',
        name: 'Pachitea',
        districts: ['Panao', 'Chaglla', 'Molino', 'Umari']
      },
      {
        id: 'puerto_inca',
        name: 'Puerto Inca',
        districts: ['Puerto Inca', 'Codo del Pozuzo', 'Honoria', 'Tournavista', 'Yuyapichis']
      },
      {
        id: 'lauricocha',
        name: 'Lauricocha',
        districts: ['Jesús', 'Baños', 'Jivia', 'Queropalca', 'Rondos', 'San Francisco de Asís', 'San Miguel de Cauri']
      },
      {
        id: 'yarowilca',
        name: 'Yarowilca',
        districts: ['Chavinillo', 'Cáhuac', 'Chacabamba', 'Aparicio Pomares', 'Jacas Chico', 'Obas', 'Pampamarca']
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
        districts: ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacútec', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San José de los Molinos', 'San Juan Bautista', 'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario']
      },
      {
        id: 'chincha',
        name: 'Chincha',
        districts: ['Chincha Alta', 'Alto Larán', 'Chavín', 'Chincha Baja', 'El Carmen', 'Grocio Prado', 'Pueblo Nuevo', 'San Juan de Yanac', 'San Pedro de Huacarpana', 'Sunampe', 'Tambo de Mora']
      },
      {
        id: 'nazca',
        name: 'Nazca',
        districts: ['Nazca', 'Changuillo', 'El Ingenio', 'Marcona', 'Vista Alegre']
      },
      {
        id: 'palpa',
        name: 'Palpa',
        districts: ['Palpa', 'Llipata', 'Río Grande', 'Santa Cruz', 'Tibillo']
      },
      {
        id: 'pisco',
        name: 'Pisco',
        districts: ['Pisco', 'Huancano', 'Humay', 'Independencia', 'Paracas', 'San Andrés', 'San Clemente', 'Túpac Amaru Inca']
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
        districts: [
          'Huancayo', 'Carhuacallanga', 'Chacapampa', 'Chicche', 'Chilca', 'Chongos Alto', 'Chupuro', 'Colca', 'Cullhuas', 'El Tambo', 'Huacrapuquio', 'Hualhuas', 'Huancán', 'Huasicancha', 'Huayucachi', 'Ingenio', 'Pariahuanca', 'Pilcomayo', 'Pucará', 'Quichuay', 'Quilcas', 'San Agustín', 'San Jerónimo de Tunán', 'Saño', 'Sapallanga', 'Sicaya', 'Santo Domingo de Acobamba', 'Viques'
        ]
      },
      {
        id: 'concepcion',
        name: 'Concepción',
        districts: ['Concepción', 'Aco', 'Andamarca', 'Chambara', 'Cochas', 'Comas', 'Heroínas Toledo', 'Manzanares', 'Mariscal Castilla', 'Matahuasi', 'Mito', 'Nueve de Julio', 'Orcotuna', 'San José de Quero', 'Santa Rosa de Ocopa']
      },
      {
        id: 'chanchamayo',
        name: 'Chanchamayo',
        districts: ['Chanchamayo', 'Perené', 'Pichanaqui', 'San Luis de Shuaro', 'San Ramón', 'Vitoc']
      },
      {
        id: 'jauja',
        name: 'Jauja',
        districts: ['Jauja', 'Acolla', 'Apata', 'Ataura', 'Canchayllo', 'Curicaca', 'El Mantaro', 'Huamalí', 'Huaripampa', 'Huertas', 'Janjaillo', 'Julcán', 'Leonor Ordóñez', 'Llocllapampa', 'Marco', 'Masma', 'Masma Chicche', 'Molinos', 'Monobamba', 'Muqui', 'Muquiyauyo', 'Paca', 'Paccha', 'Pancán', 'Parco', 'Pomacancha', 'Ricrán', 'San Lorenzo', 'San Pedro de Chunán', 'Sausa', 'Sincos', 'Tunan Marca', 'Yauli', 'Yauyos']
      },
      {
        id: 'junin',
        name: 'Junín',
        districts: ['Junín', 'Carhuamayo', 'Ondores', 'Ulcumayo']
      },
      {
        id: 'satipo',
        name: 'Satipo',
        districts: ['Satipo', 'Coviriali', 'Llaylla', 'Mazamari', 'Pampa Hermosa', 'Pangoa', 'Río Negro', 'Río Tambo', 'Vizcatán del Ene']
      },
      {
        id: 'tarma',
        name: 'Tarma',
        districts: ['Tarma', 'Acobamba', 'Huaricolca', 'Huasahuasi', 'La Unión', 'Palca', 'Palcamayo', 'San Pedro de Cajas', 'Tapo']
      },
      {
        id: 'yauli',
        name: 'Yauli',
        districts: ['La Oroya', 'Chacapalpa', 'Huay-Huay', 'Marcapomacocha', 'Morococha', 'Paccha', 'Santa Bárbara de Carhuacayán', 'Santa Rosa de Sacco', 'Suitucancha', 'Yauli']
      },
      {
        id: 'chupaca',
        name: 'Chupaca',
        districts: ['Chupaca', 'Áhuac', 'Chongos Bajo', 'Huáchac', 'Huamancaca Chico', 'San Juan de Iscos', 'San Juan de Jarpa', 'Tres de Diciembre', 'Yanacancha']
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
        districts: ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Salaverry', 'Simbal', 'Víctor Larco Herrera']
      },
      {
        id: 'ascope',
        name: 'Ascope',
        districts: ['Ascope', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri', 'Santiago de Cao', 'Casa Grande']
      },
      {
        id: 'bolivar',
        name: 'Bolívar',
        districts: ['Bolívar', 'Bambamarca', 'Condormarca', 'Longotea', 'Uchumarca', 'Ucuncha']
      },
      {
        id: 'chepen',
        name: 'Chepén',
        districts: ['Chepén', 'Pacanga', 'Pueblo Nuevo']
      },
      {
        id: 'julcan',
        name: 'Julcán',
        districts: ['Julcán', 'Calamarca', 'Carabamba', 'Huaso']
      },
      {
        id: 'otuzco',
        name: 'Otuzco',
        districts: ['Otuzco', 'Agallpampa', 'Charat', 'Huaranchal', 'La Cuesta', 'Mache', 'Paranday', 'Salpo', 'Sinsicap', 'Usquil']
      },
      {
        id: 'pacasmayo',
        name: 'Pacasmayo',
        districts: ['San Pedro de Lloc', 'Guadalupe', 'Jequetepeque', 'Pacasmayo', 'San José']
      },
      {
        id: 'pataz',
        name: 'Pataz',
        districts: ['Tayabamba', 'Buldibuyo', 'Chillia', 'Huancaspata', 'Huaylillas', 'Huayo', 'Ongón', 'Parcoy', 'Pataz', 'Pías', 'Santiago de Challas', 'Taurija', 'Urpay']
      },
      {
        id: 'sanchez_carrion',
        name: 'Sánchez Carrión',
        districts: ['Huamachuco', 'Chugay', 'Cochorco', 'Curgos', 'Marcabal', 'Sanagorán', 'Sarín', 'Sartimbamba']
      },
      {
        id: 'santiago_de_chuco',
        name: 'Santiago de Chuco',
        districts: ['Santiago de Chuco', 'Angasmarca', 'Cachicadán', 'Mollebamba', 'Mollepata', 'Quiruvilca', 'Santa Cruz de Chuca', 'Sitabamba']
      },
      {
        id: 'gran_chimu',
        name: 'Gran Chimú',
        districts: ['Cascas', 'Lucma', 'Marmot', 'Sayapullo']
      },
      {
        id: 'viru',
        name: 'Virú',
        districts: ['Virú', 'Chao', 'Guadalupito']
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
        districts: ['Chiclayo', 'Chongoyape', 'Eten', 'Eten Puerto', 'José Leonardo Ortiz', 'La Victoria', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún', 'Picsi', 'Pimentel', 'Reque', 'Santa Rosa', 'Saña', 'Cayaltí', 'Pátapo', 'Pomalca', 'Pucalá', 'Tumán']
      },
      {
        id: 'ferrenafe',
        name: 'Ferreñafe',
        districts: ['Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pítipo', 'Pueblo Nuevo']
      },
      {
        id: 'lambayeque',
        name: 'Lambayeque',
        districts: ['Lambayeque', 'Chóchope', 'Illimo', 'Jayanca', 'Mochumí', 'Mórrope', 'Motupe', 'Olmos', 'Pacora', 'Salas', 'San José', 'Túcume']
      }
    ]
  },
  {
    id: 'lima',
    name: 'Lima',
    provinces: [
      {
        id: 'lima',
        name: 'Lima',
        districts: [
          'Ancón',
          'Miraflores',
          'San Isidro',
          'Santiago de Surco',
          'San Borja',
          'Barranco',
          'La Molina',
          'Magdalena del Mar',
          'Pueblo Libre',
          'Jesús María',
          'Lince',
          'San Miguel',
          'Surquillo',
          'Cercado de Lima',
          'Los Olivos',
          'Comas',
          'San Martín de Porres',
          'Ate',
          'San Juan de Lurigancho',
          'Chorrillos',
          'Villa El Salvador',
          'Breña',
          'Carabayllo',
          'Chaclacayo',
          'Cieneguilla',
          'El Agustino',
          'Independencia',
          'La Victoria',
          'Lurigancho-Chosica',
          'Lurín',
          'Pachacámac',
          'Pucusana',
          'Puente Piedra',
          'Punta Hermosa',
          'Punta Negra',
          'Rímac',
          'San Bartolo',
          'San Juan de Miraflores',
          'San Luis',
          'Santa Anita',
          'Santa María del Mar',
          'Santa Rosa',
          'Villa María del Triunfo'
        ]
      },
      {
        id: 'barranca',
        name: 'Barranca',
        districts: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto']
      },
      {
        id: 'cajatambo',
        name: 'Cajatambo',
        districts: ['Cajatambo', 'Copa', 'Gorgor', 'Huancapón', 'Manás']
      },
      {
        id: 'canta',
        name: 'Canta',
        districts: ['Canta', 'Arahuay', 'Huamantanga', 'Huaros', 'Lachaqui', 'San Buenaventura', 'Santa Rosa de Quives']
      },
      {
        id: 'canete',
        name: 'Cañete',
        districts: ['San Vicente de Cañete', 'Asia', 'Calango', 'Cerro Azul', 'Chilca', 'Coayllo', 'Imperial', 'Lunahuaná', 'Mala', 'Nuevo Imperial', 'Pacarán', 'Quilmaná', 'San Antonio', 'San Luis', 'Santa Cruz de Flores', 'Zúñiga']
      },
      {
        id: 'huaral',
        name: 'Huaral',
        districts: ['Huaral', 'Atavillos Alto', 'Atavillos Bajo', 'Aucallama', 'Chancay', 'Ihuarí', 'Lampían', 'Pacaraos', 'San Miguel de Acos', 'Santa Cruz de Andamarca', 'Sumbilca', 'Veintisiete de Noviembre']
      },
      {
        id: 'huarochiri',
        name: 'Huarochirí',
        districts: ['Matucana', 'Antioquía', 'Callahuanca', 'Carampoma', 'Chicla', 'Cuenca', 'Huachupampa', 'Huanza', 'Huarochirí', 'Lahuaytambo', 'Langa', 'Laraos', 'Mariatana', 'Ricardo Palma', 'San Andrés de Tupicocha', 'San Antonio', 'San Bartolomé', 'San Damián', 'San Juan de Iris', 'San Juan de Tantaranche', 'San Lorenzo de Quinti', 'San Mateo', 'San Mateo de Otao', 'San Pedro de Casta', 'San Pedro de Huancayre', 'Sangallaya', 'Santa Cruz de Cocachacra', 'Santa Eulalia', 'Santiago de Anchucaya', 'Santiago de Tuna', 'Santo Domingo de los Olleros', 'Surco']
      },
      {
        id: 'huaura',
        name: 'Huaura',
        districts: ['Huacho', 'Ambar', 'Caleta de Carquín', 'Checras', 'Hualmay', 'Huaura', 'Leoncio Prado', 'Paccho', 'Santa Leonor', 'Santa María', 'Sayán', 'Végueta']
      },
      {
        id: 'oyon',
        name: 'Oyón',
        districts: ['Oyón', 'Andajes', 'Caujul', 'Cochamarca', 'Naván', 'Pachangara']
      },
      {
        id: 'yauyos',
        name: 'Yauyos',
        districts: ['Yauyos', 'Alis', 'Allauca', 'Ayaviri', 'Azángaro', 'Cacra', 'Carania', 'Catahuasi', 'Chocos', 'Cochas', 'Colonia', 'Hongos', 'Huampara', 'Huancaya', 'Huangáscar', 'Huantán', 'Huañec', 'Laraos', 'Lincha', 'Madean', 'Miraflores', 'Omas', 'Putinza', 'Quinches', 'Quinocay', 'San Joaquín', 'San Pedro de Pilas', 'Tanta', 'Tauripampa', 'Tomas', 'Tupe', 'Viñac', 'Vitis']
      }
    ]
  },
  {
    id: 'loreto',
    name: 'Loreto',
    provinces: [
      {
        id: 'maynas',
        name: 'Maynas',
        districts: ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazán', 'Napo', 'Punchana', 'Torres Causana', 'Belén', 'San Juan Bautista']
      },
      {
        id: 'alto_amazonas',
        name: 'Alto Amazonas',
        districts: ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente César López Rojas']
      },
      {
        id: 'loreto',
        name: 'Loreto',
        districts: ['Nauta', 'Parinari', 'Tigre', 'Trompeteros', 'Urarinas']
      },
      {
        id: 'mariscal_ramon_castilla',
        name: 'Mariscal Ramón Castilla',
        districts: ['Ramón Castilla', 'Pebas', 'Yavari', 'San Pablo']
      },
      {
        id: 'requena',
        name: 'Requena',
        districts: ['Requena', 'Alto Tapiche', 'Capelo', 'Emilio San Martín', 'Maquía', 'Puinahua', 'Saquena', 'Soplin', 'Tapiche', 'Yaquerana']
      },
      {
        id: 'ucayali_loreto',
        name: 'Ucayali',
        districts: ['Contamana', 'Inahuaya', 'Padre Márquez', 'Pampa Hermosa', 'Sarayacu', 'Vargas Guerra']
      },
      {
        id: 'datem_del_maranon',
        name: 'Datem del Marañón',
        districts: ['Barranca', 'Cahuapanas', 'Manseriche', 'Morona', 'Pastaza', 'Andoas']
      },
      {
        id: 'putumayo',
        name: 'Putumayo',
        districts: ['Putumayo', 'Rosa Panduro', 'Teniente Manuel Clavero', 'Yaguas']
      }
    ]
  },
  {
    id: 'madre_de_dios',
    name: 'Madre de Dios',
    provinces: [
      {
        id: 'tambopata',
        name: 'Tambopata',
        districts: ['Tambopata', 'Inambari', 'Las Piedras', 'Laberinto']
      },
      {
        id: 'manu',
        name: 'Manu',
        districts: ['Manu', 'Fitzcarrald', 'Madre de Dios', 'Huepetuhe']
      },
      {
        id: 'tahuamanu',
        name: 'Tahuamanu',
        districts: ['Iñapari', 'Iberia', 'Tahuamanu']
      }
    ]
  },
  {
    id: 'moquegua',
    name: 'Moquegua',
    provinces: [
      {
        id: 'mariscal_nieto',
        name: 'Mariscal Nieto',
        districts: ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata']
      },
      {
        id: 'general_sanchez_cerro',
        name: 'General Sánchez Cerro',
        districts: ['Omate', 'Chojata', 'Coalaque', 'Ichuña', 'La Capilla', 'Lloque', 'Matalaque', 'Puquina', 'Quinistaquillas', 'Ubinas', 'Yunga']
      },
      {
        id: 'ilo',
        name: 'Ilo',
        districts: ['Ilo', 'El Algarrobal', 'Pacocha']
      }
    ]
  },
  {
    id: 'pasco',
    name: 'Pasco',
    provinces: [
      {
        id: 'pasco',
        name: 'Pasco',
        districts: ['Chaupimarca', 'Huachón', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 'Paucartambo', 'San Francisco de Asís de Yarusyacán', 'Simón Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco', 'Yanacancha']
      },
      {
        id: 'daniel_alcides_carrion',
        name: 'Daniel Alcides Carrión',
        districts: ['Yanahuanca', 'Chacayán', 'Goyllarisquizga', 'Paucar', 'San Pedro de Pillao', 'Santa Ana de Tusi', 'Tápuc', 'Vilcabamba']
      },
      {
        id: 'oxapampa',
        name: 'Oxapampa',
        districts: ['Oxapampa', 'Chontabamba', 'Huancabamba', 'Palcazú', 'Pozuzo', 'Puerto Bermúdez', 'Villa Rica', 'Constitución']
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
        districts: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre']
      },
      {
        id: 'ayabaca',
        name: 'Ayabaca',
        districts: ['Ayabaca', 'Frias', 'Jilili', 'Lagunas', 'Montero', 'Pacaipampa', 'Paimas', 'Sapillica', 'Sicchez', 'Suyo']
      },
      {
        id: 'huancabamba',
        name: 'Huancabamba',
        districts: ['Huancabamba', 'Canchaque', 'El Carmen de la Frontera', 'Huarmaca', 'Lalaquiz', 'San Miguel de El Faique', 'Sóndor', 'Sondorillo']
      },
      {
        id: 'morropon',
        name: 'Morropón',
        districts: ['Chulucanas', 'Buenos Aires', 'Chalaco', 'La Matanza', 'Morropón', 'Salitral', 'San Juan de Bigote', 'Santa Catalina de Mossa', 'Santo Domingo', 'Yamango']
      },
      {
        id: 'paita',
        name: 'Paita',
        districts: ['Paita', 'Amotape', 'Arenal', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal']
      },
      {
        id: 'sullana',
        name: 'Sullana',
        districts: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral']
      },
      {
        id: 'talara',
        name: 'Talara',
        districts: ['Pariñas', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora']
      },
      {
        id: 'sechura',
        name: 'Sechura',
        districts: ['Sechura', 'Bellavista de la Unión', 'Bernal', 'Cristo Nos Valga', 'Vice', 'Rinconada Llicuar']
      }
    ]
  },
  {
    id: 'puno',
    name: 'Puno',
    provinces: [
      {
        id: 'puno',
        name: 'Puno',
        districts: ['Puno', 'Acora', 'Amantaní', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque']
      },
      {
        id: 'azangaro',
        name: 'Azángaro',
        districts: ['Azángaro', 'Achaya', 'Arapa', 'Asillo', 'Caminaca', 'Chupa', 'José Domingo Choquehuanca', 'Muñani', 'Potoni', 'Samán', 'San Antón', 'San José', 'San Juan de Salinas', 'Santiago de Pupuja', 'Tirapata']
      },
      {
        id: 'carabaya',
        name: 'Carabaya',
        districts: ['Macusani', 'Ajoyani', 'Ayapata', 'Coasa', 'Corani', 'Crucero', 'Ituata', 'Ollachea', 'San Gabán', 'Usicayos']
      },
      {
        id: 'chucuito',
        name: 'Chucuito',
        districts: ['Juli', 'Desaguadero', 'Huacullani', 'Kelluyo', 'Pisacoma', 'Pomata', 'Zepita']
      },
      {
        id: 'el_collao',
        name: 'El Collao',
        districts: ['Ilave', 'Capazo', 'Pilcuyo', 'Santa Rosa', 'Conduriri']
      },
      {
        id: 'huancane',
        name: 'Huancané',
        districts: ['Huancané', 'Cojata', 'Huatasani', 'Inchupalla', 'Pusi', 'Rosaspata', 'Taraco', 'Vilque Chico']
      },
      {
        id: 'lampa',
        name: 'Lampa',
        districts: ['Lampa', 'Cabanilla', 'Calapuja', 'Nicasio', 'Ocuviri', 'Palca', 'Paratía', 'Pucará', 'Santa Lucía', 'Vilavila']
      },
      {
        id: 'melgar',
        name: 'Melgar',
        districts: ['Ayaviri', 'Antauta', 'Cupi', 'Llalli', 'Macari', 'Nuñoa', 'Orurillo', 'Santa Rosa', 'Umachiri']
      },
      {
        id: 'moho',
        name: 'Moho',
        districts: ['Moho', 'Conima', 'Huayrapata', 'Tilali']
      },
      {
        id: 'san_antonio_de_putina',
        name: 'San Antonio de Putina',
        districts: ['Putina', 'Ananea', 'Pedro Vilca Apaza', 'Quilcapuncu', 'Sina']
      },
      {
        id: 'san_roman',
        name: 'San Román',
        districts: ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto']
      },
      {
        id: 'sandia',
        name: 'Sandia',
        districts: ['Sandia', 'Cuyocuyo', 'Limbani', 'Patambuco', 'Phara', 'Quiaca', 'San Juan del Oro', 'Yanahuaya', 'Alto Inambari', 'San Pedro de Putina Punco']
      },
      {
        id: 'yunguyo',
        name: 'Yunguyo',
        districts: ['Yunguyo', 'Anapia', 'Copani', 'Cuturapi', 'Ollaraya', 'Tinicachi', 'Unicachi']
      }
    ]
  },
  {
    id: 'san_martin',
    name: 'San Martín',
    provinces: [
      {
        id: 'moyobamba',
        name: 'Moyobamba',
        districts: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantaló']
      },
      {
        id: 'bellavista',
        name: 'Bellavista',
        districts: ['Bellavista', 'Alto Biavo', 'Bajo Biavo', 'Huallaga', 'San Pablo', 'San Rafael']
      },
      {
        id: 'el_dorado',
        name: 'El Dorado',
        districts: ['San José de Sisa', 'Agua Blanca', 'San Martín', 'Santa Rosa', 'Shatoña']
      },
      {
        id: 'huallaga',
        name: 'Huallaga',
        districts: ['Saposoa', 'Alto Saposoa', 'El Eslabón', 'Piscoyacu', 'Sacanche', 'Tingo de Saposoa']
      },
      {
        id: 'lamas',
        name: 'Lamas',
        districts: ['Lamas', 'Alonso de Alvarado', 'Barranquita', 'Caynarachi', 'Cuñumbuqui', 'Pinto Recodo', 'Rumisapa', 'San Roque de Cumbaza', 'Shanao', 'Tabalosos', 'Zapatero']
      },
      {
        id: 'mariscal_caceres',
        name: 'Mariscal Cáceres',
        districts: ['Juanjuí', 'Campanilla', 'Huicungo', 'Pachiza', 'Pajarillo']
      },
      {
        id: 'picota',
        name: 'Picota',
        districts: ['Picota', 'Buenos Aires', 'Caspizapa', 'Pucacaca', 'Puerto Rico', 'San Cristóbal', 'San Hilarión', 'Shamboyacu', 'Tingo de Ponasa', 'Tres Unidos']
      },
      {
        id: 'rioja',
        name: 'Rioja',
        districts: ['Rioja', 'Awajún', 'Elías Sópalo Castillo', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic', 'San Fernando', 'Yorongos']
      },
      {
        id: 'san_martin',
        name: 'San Martín',
        districts: ['Tarapoto', 'Alberto Leveau', 'Cacatachi', 'Chazuta', 'Chipurana', 'El Porvenir', 'Huimbayoc', 'Juan Guerra', 'La Banda de Shilcayo', 'Morales', 'Papaplaya', 'San Antonio', 'Sauce', 'Shapaja']
      },
      {
        id: 'tocache',
        name: 'Tocache',
        districts: ['Tocache', 'Nuevo Progreso', 'Pólvora', 'Shunté', 'Uchiza']
      }
    ]
  },
  {
    id: 'tacna',
    name: 'Tacna',
    provinces: [
      {
        id: 'tacna',
        name: 'Tacna',
        districts: ['Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Inclán', 'Pachía', 'Palca', 'Pocollay', 'Sama', 'Coronel Gregorio Albarracín Lanchipa', 'La Yarada Los Palos']
      },
      {
        id: 'candarave',
        name: 'Candarave',
        districts: ['Candarave', 'Cairani', 'Camilaca', 'Curibaya', 'Huanuara', 'Quilahuani']
      },
      {
        id: 'jorge_basadre',
        name: 'Jorge Basadre',
        districts: ['Locumba', 'Ilabaya', 'Ite']
      },
      {
        id: 'tarata',
        name: 'Tarata',
        districts: ['Tarata', 'Chucatamani', 'Estique', 'Estique-Pampa', 'Sitajara', 'Susapaya', 'Tarucachi', 'Ticaco']
      }
    ]
  },
  {
    id: 'tumbes',
    name: 'Tumbes',
    provinces: [
      {
        id: 'tumbes',
        name: 'Tumbes',
        districts: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen']
      },
      {
        id: 'contralmirante_villar',
        name: 'Contralmirante Villar',
        districts: ['Zorritos', 'Casitas', 'Canoas de Punta Sal']
      },
      {
        id: 'zarumilla',
        name: 'Zarumilla',
        districts: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal']
      }
    ]
  },
  {
    id: 'ucayali',
    name: 'Ucayali',
    provinces: [
      {
        id: 'coronel_portillo',
        name: 'Coronel Portillo',
        districts: ['Callería', 'Campoverde', 'Iparía', 'Masisea', 'Yarinacocha', 'Nueva Requena', 'Manantay']
      },
      {
        id: 'atalaya',
        name: 'Atalaya',
        districts: ['Raimondi', 'Sepahua', 'Tahuanía', 'Yurúa']
      },
      {
        id: 'padre_abad',
        name: 'Padre Abad',
        districts: ['Padre Abad', 'Irazola', 'Curimaná', 'Neshuya', 'Alexander von Humboldt']
      },
      {
        id: 'purus',
        name: 'Purús',
        districts: ['Purús']
      }
    ]
  }
];

/**
 * Retorna la lista de todos los departamentos disponibles (25 entidades departamentales / regionales).
 */
export function getDepartments(): { id: string; name: string }[] {
  return PERU_DEPARTMENTS.map(d => ({ id: d.id, name: d.name }));
}

/**
 * Retorna las provincias pertenecientes a un departamento dado su id o nombre.
 */
export function getProvinces(deptId: string): PeruProvince[] {
  if (!deptId) return [];
  const normalized = deptId.trim().toLowerCase();
  const dept = PERU_DEPARTMENTS.find(d =>
    d.id.toLowerCase() === normalized ||
    d.name.toLowerCase() === normalized
  );
  return dept?.provinces || [];
}

/**
 * Retorna los distritos pertenecientes a una provincia dada dentro de un departamento.
 */
export function getDistricts(deptId: string, provId: string): string[] {
  const provinces = getProvinces(deptId);
  if (!provinces || provinces.length === 0) return [];
  if (!provId) return provinces[0]?.districts || [];

  const normalizedProv = provId.trim().toLowerCase();
  const prov = provinces.find(p =>
    p.id.toLowerCase() === normalizedProv ||
    p.name.toLowerCase() === normalizedProv
  );
  return prov?.districts || [];
}

/**
 * Parsea una cadena de ubicación (ej. "Miraflores, Lima - Lima" o "Lima")
 * y resuelve deptId, provId y districtName con fallbacks defensivos garantizados.
 */
export function parseLocationCity(cityString?: string): { deptId: string; provId: string; districtName: string } {
  const defaultLocation = {
    deptId: 'lima',
    provId: 'lima',
    districtName: 'Miraflores'
  };

  if (!cityString || typeof cityString !== 'string' || !cityString.trim()) {
    return defaultLocation;
  }

  const raw = cityString.trim();

  // Caso estándar compuesto: "Distrito, Provincia - Departamento"
  if (raw.includes(' - ')) {
    const [leftPart, deptPart] = raw.split(' - ').map(s => s.trim());
    const deptNameOrId = deptPart || '';

    let matchedDept = PERU_DEPARTMENTS.find(d =>
      d.name.toLowerCase() === deptNameOrId.toLowerCase() ||
      d.id.toLowerCase() === deptNameOrId.toLowerCase()
    );

    if (!matchedDept && deptNameOrId) {
      matchedDept = PERU_DEPARTMENTS.find(d =>
        d.name.toLowerCase().includes(deptNameOrId.toLowerCase()) ||
        deptNameOrId.toLowerCase().includes(d.name.toLowerCase())
      );
    }

    const dept = matchedDept || PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];
    const deptId = dept.id;

    let provNameOrId = '';
    let districtName = '';

    if (leftPart.includes(',')) {
      const parts = leftPart.split(',').map(s => s.trim());
      districtName = parts[0] || '';
      provNameOrId = parts[1] || '';
    } else {
      districtName = leftPart;
    }

    let matchedProv = dept.provinces.find(p =>
      (provNameOrId && p.name.toLowerCase() === provNameOrId.toLowerCase()) ||
      (provNameOrId && p.id.toLowerCase() === provNameOrId.toLowerCase())
    );

    if (!matchedProv && provNameOrId) {
      matchedProv = dept.provinces.find(p =>
        p.name.toLowerCase().includes(provNameOrId.toLowerCase()) ||
        provNameOrId.toLowerCase().includes(p.name.toLowerCase())
      );
    }

    if (!matchedProv && districtName) {
      matchedProv = dept.provinces.find(p =>
        p.districts.some(d => d.toLowerCase() === districtName.toLowerCase())
      );
    }

    const prov = matchedProv || dept.provinces[0];
    const provId = prov ? prov.id : 'lima';

    let validDistrict = districtName;
    if (prov && prov.districts && prov.districts.length > 0) {
      const foundDist = prov.districts.find(d => d.toLowerCase() === districtName.toLowerCase());
      if (foundDist) {
        validDistrict = foundDist;
      } else if (!validDistrict) {
        validDistrict = prov.districts[0];
      }
    } else if (!validDistrict) {
      validDistrict = 'Centro';
    }

    return { deptId, provId, districtName: validDistrict };
  }

  // Búsqueda simple cuando no contiene ' - '
  const term = raw.toLowerCase();

  // 1. ¿Coincide con un departamento?
  const matchedDept = PERU_DEPARTMENTS.find(d =>
    d.id.toLowerCase() === term || d.name.toLowerCase() === term
  );
  if (matchedDept) {
    const firstProv = matchedDept.provinces[0];
    return {
      deptId: matchedDept.id,
      provId: firstProv ? firstProv.id : matchedDept.id,
      districtName: firstProv && firstProv.districts.length > 0 ? firstProv.districts[0] : 'Centro'
    };
  }

  // 2. ¿Coincide con una provincia?
  for (const dept of PERU_DEPARTMENTS) {
    const prov = dept.provinces.find(p => p.id.toLowerCase() === term || p.name.toLowerCase() === term);
    if (prov) {
      return {
        deptId: dept.id,
        provId: prov.id,
        districtName: prov.districts.length > 0 ? prov.districts[0] : 'Centro'
      };
    }
  }

  // 3. ¿Coincide con un distrito?
  for (const dept of PERU_DEPARTMENTS) {
    for (const prov of dept.provinces) {
      const dist = prov.districts.find(d => d.toLowerCase() === term);
      if (dist) {
        return {
          deptId: dept.id,
          provId: prov.id,
          districtName: dist
        };
      }
    }
  }

  return defaultLocation;
}

