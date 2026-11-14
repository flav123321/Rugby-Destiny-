// Les 20 sélections jouables (top 20 World Rugby, novembre 2026).
// conference : 'nord' (Six Nations) ou 'sud' (Nations Championship, poule « reste du monde »), 'cup' = World Rugby Nations Cup.
// base : niveau de référence (sert aux joueurs générés et aux U20).
export const NATIONS = {
  ZA: { conference: 'sud', base: 81 }, NZ: { conference: 'sud', base: 81 }, IE: { conference: 'nord', base: 79 },
  FR: { conference: 'nord', base: 79 }, EN: { conference: 'nord', base: 78 }, SC: { conference: 'nord', base: 76 },
  AU: { conference: 'sud', base: 76 }, AR: { conference: 'sud', base: 76 }, FJ: { conference: 'sud', base: 74 },
  WA: { conference: 'nord', base: 73 }, IT: { conference: 'nord', base: 74 }, JP: { conference: 'sud', base: 72 },
  GE: { conference: 'cup', base: 70 }, PT: { conference: 'cup', base: 67 }, US: { conference: 'cup', base: 64 },
  ES: { conference: 'cup', base: 65 }, TO: { conference: 'cup', base: 66 }, CL: { conference: 'cup', base: 63 },
  WS: { conference: 'cup', base: 66 }, UY: { conference: 'cup', base: 63 },
};
export const SIX_NATIONS = ['FR', 'EN', 'IE', 'SC', 'WA', 'IT'];
export const NATIONS_CHAMPIONSHIP = ['FR', 'EN', 'IE', 'SC', 'WA', 'IT', 'ZA', 'NZ', 'AU', 'AR', 'FJ', 'JP'];

// Prénoms et noms par pays, pour compléter les effectifs (sélections et ligues sans vrais joueurs).
export const NOMS = {
  FR: [['Hugo', 'Lucas', 'Mathis', 'Théo', 'Enzo', 'Baptiste', 'Romain', 'Clément', 'Maxime', 'Antoine', 'Louis', 'Thomas'], ['Laporte', 'Dufau', 'Larrieu', 'Castagnet', 'Bergès', 'Lacoste', 'Puyo', 'Marty', 'Soubie', 'Casteran', 'Lafitte', 'Ducasse']],
  EN: [['Jack', 'Harry', 'Oliver', 'George', 'Charlie', 'Tom', 'Sam', 'Will', 'Ben', 'Joe', 'Alfie', 'Freddie'], ['Thompson', 'Clarke', 'Walker', 'Hughes', 'Bennett', 'Turner', 'Parker', 'Cooper', 'Wright', 'Morris', 'Hall', 'Fletcher']],
  IE: [['Conor', 'Cian', 'Seán', 'Oisín', 'Darragh', 'Niall', 'Ronan', 'Eoin', 'Fionn', 'Cathal'], ["O'Sullivan", 'Murphy', 'Byrne', 'Kelly', 'Doyle', 'Brennan', 'Quinn', 'Gallagher', "O'Connell", 'Daly']],
  SC: [['Callum', 'Fraser', 'Hamish', 'Euan', 'Rory', 'Angus', 'Lewis', 'Murray', 'Kyle', 'Ross'], ['MacLeod', 'Campbell', 'Stewart', 'Fraser', 'Robertson', 'Murray', 'Henderson', 'Paterson', 'Douglas', 'Kerr']],
  WA: [['Rhys', 'Dafydd', 'Owen', 'Gethin', 'Ioan', 'Steffan', 'Gareth', 'Morgan', 'Elis', 'Huw'], ['Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Morgan', 'Price', 'Griffiths']],
  IT: [['Matteo', 'Lorenzo', 'Alessandro', 'Davide', 'Federico', 'Giovanni', 'Marco', 'Andrea', 'Simone', 'Nicolò'], ['Rossi', 'Bianchi', 'Romano', 'Gallo', 'Conti', 'Ferraro', 'Esposito', 'Ricci', 'Marino', 'Greco']],
  ZA: [['Ruan', 'Jaco', 'Pieter', 'Siya', 'Thabo', 'Willem', 'Andile', 'Johan', 'Duan', 'Lwazi'], ['van der Merwe', 'Botha', 'Nel', 'Pretorius', 'Mokoena', 'du Plessis', 'Jacobs', 'Venter', 'Dlamini', 'Kruger']],
  NZ: [['Tama', 'Lachlan', 'Hoskins', 'Sione', 'Riley', 'Ethan', 'Caleb', 'Taine', 'Josh', 'Leicester'], ['Tuilagi', 'Smith', 'Taufa', 'Ngata', 'Walker', 'Tupou', 'Brown', 'Hohaia', 'Fainga\'a', 'Wilson']],
  AU: [['Lachlan', 'Jake', 'Harrison', 'Cooper', 'Mitch', 'Angus', 'Liam', 'Zac', 'Darcy', 'Blake'], ['Mitchell', 'Kelly', 'Ryan', 'McDonald', 'Ford', 'Harris', 'Anderson', 'Reid', 'Taylor', 'Holmes']],
  AR: [['Juan', 'Santiago', 'Tomás', 'Facundo', 'Ignacio', 'Matías', 'Lucas', 'Nicolás', 'Agustín', 'Bautista'], ['González', 'Fernández', 'Álvarez', 'Sosa', 'Romero', 'Pérez', 'Gómez', 'Medina', 'Herrera', 'Castro']],
  FJ: [['Josua', 'Semi', 'Viliame', 'Isoa', 'Waisea', 'Sireli', 'Eroni', 'Peni', 'Ratu', 'Tevita'], ['Nakarawa', 'Ratuva', 'Vakatawa', 'Tuisue', 'Masi', 'Radrodro', 'Waqa', 'Naivalu', 'Volavola', 'Botitu']],
  JP: [['Takuya', 'Kenta', 'Shota', 'Yuto', 'Ryo', 'Daiki', 'Haruki', 'Kaito', 'Sora', 'Tatsuya'], ['Tanaka', 'Suzuki', 'Sato', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Watanabe', 'Ito', 'Kato', 'Yoshida']],
  GE: [['Giorgi', 'Luka', 'Levan', 'Beka', 'Lasha', 'Davit', 'Shalva', 'Tornike', 'Irakli', 'Nika'], ['Kvaratskhelia', 'Beridze', 'Lomidze', 'Abuladze', 'Kapanadze', 'Gelashvili', 'Tsiklauri', 'Mchedlidze', 'Javakhishvili', 'Bregvadze']],
  PT: [['João', 'Tomás', 'Duarte', 'Rodrigo', 'Pedro', 'Francisco', 'Miguel', 'Martim', 'Gonçalo', 'Diogo'], ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Lopes', 'Gomes']],
  US: [['Tyler', 'Jake', 'Cole', 'Ryan', 'Brandon', 'Connor', 'Logan', 'Austin', 'Hunter', 'Mason'], ['Johnson', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Martin', 'Jackson', 'White', 'Lee']],
  ES: [['Pablo', 'Álvaro', 'Iñaki', 'Javier', 'Sergio', 'Diego', 'Jon', 'Guillermo', 'Unai', 'Marco'], ['García', 'Martínez', 'López', 'Sánchez', 'Etxeberria', 'Ruiz', 'Moreno', 'Aguirre', 'Navarro', 'Ortega']],
  TO: [['Sione', 'Viliami', 'Siosaia', 'Paula', 'Tevita', 'Semisi', 'Lisiate', 'Tomasi', 'Mateo', 'Feleti'], ['Fifita', 'Taumalolo', 'Kioa', 'Havili', 'Tonga\'uiha', 'Lolohea', 'Piutau', 'Fonua', 'Vainikolo', 'Moala']],
  CL: [['Matías', 'Benjamín', 'Ignacio', 'Vicente', 'Joaquín', 'Martín', 'Cristóbal', 'Felipe', 'Diego', 'Tomás'], ['Muñoz', 'Rojas', 'Díaz', 'Soto', 'Contreras', 'Silva', 'Araya', 'Espinoza', 'Reyes', 'Fuentes']],
  WS: [['Alapati', 'Jordan', 'Seilala', 'Tusi', 'Afa', 'Melani', 'Fritz', 'Neria', 'Ah See', 'Duncan'], ['Leiua', 'Lam', 'Tuala', 'Pisi', 'Aumua', 'Fonoti', 'Lemalu', 'Fidow', 'Tuilagi', 'Seiuli']],
  UY: [['Nicolás', 'Santiago', 'Felipe', 'Manuel', 'Agustín', 'Juan Manuel', 'Mateo', 'Germán', 'Ignacio', 'Rodrigo'], ['Rodríguez', 'Etcheverry', 'Freitas', 'Arocena', 'Basso', 'Kessler', 'Amaya', 'Berchesi', 'Ardao', 'Vilaseca']],
};
