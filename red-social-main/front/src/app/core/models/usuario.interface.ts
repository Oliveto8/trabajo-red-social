export interface Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  fechaNacimiento?: string;
  bio?: string;
  avatar?: string;
  rol?: string; // <-- Agregá esta línea para que el guard la reconozca
}