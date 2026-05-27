# Caso de Uso: Gestión de Usuario

## Diagrama UML

```mermaid
useCase
    left to right direction

    actor "Usuario" as user

    rectangle "FoodLight" {
        package "Autenticación" {
            usecase "Registrarse" as UC001
            usecase "Iniciar Sesión" as UC002
            usecase "Cerrar Sesión" as UC003
            usecase "Recuperar Contraseña" as UC004
        }

        package "Perfil" {
            usecase "Ver Perfil" as UC005
            usecase "Editar Perfil" as UC006
            usecase "Configurar Condiciones Médicas" as UC007
            usecase "Ver Historial de Búsquedas" as UC008
        }
    }

    user --> UC001
    user --> UC002
    user --> UC003
    user --> UC004
    user --> UC005
    user --> UC006
    user --> UC007
    user --> UC008

    UC006 ..> UC005 : <<includes>>
    UC007 ..> UC005 : <<includes>>
    UC008 ..> UC005 : <<includes>>
```

---

## Especificación de Actores

| Actor | Descripción |
|-------|------------|
| **Usuario** | Persona que usa la aplicación para gestionar su alimentación y salud |

---

## Especificación de Casos de Uso

### UC001: Registrarse

```mermaid
useCase
    actor "Usuario" as user
    usecase "Registrarse" as UC001
    user --> UC001
```

**Descripción**: El usuario crea una cuenta nueva en la aplicación

**Precondiciones**: El usuario no tiene cuenta registrada

---

### UC002: Iniciar Sesión

```mermaid
useCase
    actor "Usuario" as user
    usecase "Iniciar Sesión" as UC002
    user --> UC002
```

**Descripción**: El usuario accede a su cuenta existentes

**Precondiciones**: El usuario tiene cuenta registrada

---

### UC003: Cerrar Sesión

```mermaid
useCase
    actor "Usuario" as user
    usecase "Cerrar Sesión" as UC003
    user --> UC003
```

**Descripción**: El usuario cierra su sesión activa

**Precondiciones**: Hay sesión activa

---

### UC004: Recuperar Contraseña

```mermaid
useCase
    actor "Usuario" as user
    usecase "Recuperar Contraseña" as UC004
    user --> UC004
```

**Descripción**: El usuario recupera su contraseña por email

**Precondiciones**: El usuario tiene cuenta registrada

---

### UC005: Ver Perfil

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Perfil" as UC005
    user --> UC005
```

**Descripción**: El usuario visualiza su información de perfil

**Precondiciones**: Sesión activa

---

### UC006: Editar Perfil

```mermaid
useCase
    actor "Usuario" as user
    usecase "Editar Perfil" as UC006
    usecase "Ver Perfil" as UC005
    user --> UC006
    UC006 ..> UC005 : <<includes>>
```

**Descripción**: El usuario modifica su información personal

**Precondiciones**: Sesión activa

---

### UC007: Configurar Condiciones Médicas

```mermaid
useCase
    actor "Usuario" as user
    usecase "Configurar Condiciones Médicas" as UC007
    usecase "Ver Perfil" as UC005
    user --> UC007
    UC007 ..> UC005 : <<includes>>
```

**Descripción**: El usuario selecciona sus condiciones médicas para el semáforo

**Precondiciones**: Sesión activa

---

### UC008: Ver Historial de Búsquedas

```mermaid
useCase
    actor "Usuario" as user
    usecase "Ver Historial de Búsquedas" as UC008
    usecase "Ver Perfil" as UC005
    user --> UC008
    UC008 ..> UC005 : <<includes>>
```

**Descripción**: El usuario consulta sus búsquedas anteriores

**Precondiciones**: Sesión activa