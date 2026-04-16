# Dudas para aclarar con el Owner - Kuneo

## Roles de usuario

Actualmente el sistema implementa una distinción básica entre **`admin`** y **`user`** en la gestión de accesos y permisos. Sin embargo, en los tipos de TypeScript y en las custom claims de Firebase Auth existen roles adicionales como **`apoderado`** y **`operario`**.

**Pregunta:** ¿Desea el dueño del proyecto mantener únicamente dos roles (`admin` / `user`) para simplificar la gestión de permisos, o prefiere conservar los cuatro roles (`admin`, `apoderado`, `operario`, `user`) desde el lanzamiento?

### Implicaciones técnicas
- **Dos roles:** Permite una matriz de permisos mucho más simple (Firestore rules, Cloud Functions, UI condicional).
- **Cuatro roles:** Requiere definir con precisión qué puede hacer cada rol (por ejemplo, ¿un `apoderado` solo ve instalaciones asignadas? ¿un `operario` puede cambiar estados de incidencias pero no crear propiedades?).

**Recomendación técnica:** Si la fecha de lanzamiento es prioridad, sugerimos lanzar con `admin` + `user` y añadir `apoderado` / `operario` en una iteración posterior una vez definidos sus alcances exactos.

---

*Fecha de generación: 2026-04-15*
