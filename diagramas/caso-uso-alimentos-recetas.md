# Caso de Uso: Gestión de Alimentos y Recetas

## Diagrama UML

```mermaid
useCase
    left to right direction

    actor "Usuario" as user

    rectangle "FoodLight" {
        package "Alimentos" {
            usecase "Ver Listado de Alimentos" as UC101
            usecase "Buscar Alimento" as UC102
            usecase "Ver Detalle de Alimento" as UC103
            usecase "Ver Semáforo de Alimento" as UC104
            usecase "Filtrar por Grupo" as UC105
            usecase "Agregar a Favoritos" as UC106
        }

        package "Recetas" {
            usecase "Ver Recetas" as UC201
            usecase "Buscar Recetas" as UC202
            usecase "Ver Detalle de Receta" as UC203
            usecase "Ver Recetas por Condición" as UC204
            usecase "Agregar Receta a Favoritos" as UC205
        }
    }

    user --> UC101
    user --> UC102
    user --> UC103
    user --> UC104
    user --> UC105
    user --> UC106
    user --> UC201
    user --> UC202
    user --> UC203
    user --> UC204
    user --> UC205

    UC102 ..> UC101 : <<includes>>
    UC103 ..> UC101 : <<includes>>
    UC104 ..> UC103 : <<includes>>
    UC105 ..> UC101 : <<includes>>
    UC202 ..> UC201 : <<includes>>
    UC203 ..> UC201 : <<includes>>
    UC204 ..> UC201 : <<includes>>
```

---

## Especificación de Actores

| Actor | Descripción |
|-------|------------|
| **Usuario** | Persona que usa la aplicación para gestionar su alimentación y salud |

---

## Especificación de Casos de Uso - Alimentos

### UC101: Ver Listado de Alimentos

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Listado de Alimentos" as UC101
    user --> UC101
```

**Descripción**: El usuario visualiza la lista de alimentos por grupo

**Precondiciones**: Sesión activa

---

### UC102: Buscar Alimento

```mermaid
useCase
    actor "Usuario" as user
    usecase "Buscar Alimento" as UC102
    usecase "Ver Listado de Alimentos" as UC101
    user --> UC102
    UC102 ..> UC101 : <<includes>>
```

**Descripción**: El usuario busca alimentos por nombre

**Precondiciones**: Sesión activa

---

### UC103: Ver Detalle de Alimento

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Detalle de Alimento" as UC103
    usecase "Ver Listado de Alimentos" as UC101
    user --> UC103
    UC103 ..> UC101 : <<includes>>
```

**Descripción**: El usuario visualiza información completa de un alimento

**Precondiciones**: Sesión activa

---

### UC104: Ver Semáforo de Alimento

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Semáforo de Alimento" as UC104
    usecase "Ver Detalle de Alimento" as UC103
    user --> UC104
    UC104 ..> UC103 : <<includes>>
```

**Descripción**: El usuario ve el código de color del semáforo

**Precondiciones**: Sesión activa, alimento seleccionado

---

### UC105: Filtrar por Grupo

```mermaid
useCase
    actor "Usuario" as user
    usecase "Filtrar por Grupo" as UC105
    usecase "Ver Listado de Alimentos" as UC101
    user --> UC105
    UC105 ..> UC101 : <<includes>>
```

**Descripción**: El usuario filtra alimentos por grupo alimenticio

**Precondiciones**: Sesión activa

---

### UC106: Agregar Alimento a Favoritos

```mermaid
useCase
    actor "Usuario" as user
    usecase "Agregar a Favoritos" as UC106
    user --> UC106
```

**Descripción**: El usuario marca un alimento como favorito

**Precondiciones**: Sesión activa

---

## Especificación de Casos de Uso - Recetas

### UC201: Ver Recetas

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Recetas" as UC201
    user --> UC201
```

**Descripción**: El usuario visualiza el catálogo de recetas

**Precondiciones**: Sesión activa

---

### UC202: Buscar Recetas

```mermaid
useCase
    actor "Usuario" as user
    usecase "Buscar Recetas" as UC202
    usecase "Ver Recetas" as UC201
    user --> UC202
    UC202 ..> UC201 : <<includes>>
```

**Descripción**: El usuario busca recetas por nombre

**Precondiciones**: Sesión activa

---

### UC203: Ver Detalle de Receta

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Detalle de Receta" as UC203
    usecase "Ver Recetas" as UC201
    user --> UC203
    UC203 ..> UC201 : <<includes>>
```

**Descripción**: El usuario visualiza una receta completa

**Precondiciones**: Sesión activa

---

### UC204: Ver Recetas por Condición

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Recetas por Condición" as UC204
    usecase "Ver Recetas" as UC201
    user --> UC204
    UC204 ..> UC201 : <<includes>>
```

**Descripción**: El usuario filtra recetas recomendadas para su condición

**Precondiciones**: Sesión activa, condiciones configuradas

---

### UC205: Agregar Receta a Favoritos

```mermaid
useCase
    actor "Usuario" as user
    usecase "Agregar Receta a Favoritos" as UC205
    user --> UC205
```

**Descripción**: El usuario marca una receta como favorita

**Precondiciones**: Sesión activa