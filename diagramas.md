# FoodLight - Diagramas del Proyecto

## 1. Diagrama de Entidad-Relación (DER)

```mermaid
erDiagram
    %% CATÁLOGOS BASE
    grupos_alimentos {
        int id PK
        varchar nombre
        text descripcion
        timestamptz created_at
    }

    alimentos {
        int id PK
        int grupo_id FK
        varchar nombre
        varchar nombre_normalizado
        varchar cantidad_sugerida
        varchar unidad
        numeric peso_bruto_g
        numeric peso_neto_g
        numeric energia_kcal
        numeric proteina_g
        numeric lipidos_g
        numeric hidratos_carbono_g
        numeric ag_saturados_g
        numeric ag_monoinsaturados_g
        numeric ag_poliinsaturados_g
        numeric colesterol_mg
        numeric azucar_g
        numeric fibra_g
        numeric vitamina_a_mg_re
        numeric acido_ascorbico_mg
        numeric acido_folico_mg
        numeric calcio_mg
        numeric hierro_mg
        numeric potasio_mg
        numeric sodio_mg
        numeric fosforo_mg
        numeric etanol_g
        numeric indice_glucemico
        numeric carga_glucemica
        boolean contiene_gluten
        timestamptz created_at
        timestamptz updated_at
    }

    %% USUARIOS Y PERFILES
    profiles {
        uuid id PK
        varchar nombre
        date fecha_nacimiento
        char sexo
        numeric peso_kg
        numeric talla_cm
        timestamptz created_at
        timestamptz updated_at
    }

    condiciones_medicas {
        int id PK
        varchar clave
        varchar nombre
        text descripcion
        varchar icono
        timestamptz created_at
    }

    usuario_condiciones {
        uuid usuario_id FK
        int condicion_id FK
        boolean activa
        date fecha_inicio
        timestamptz created_at
    }

    %% SISTEMA SEMÁFORO
    reglas_semaforo {
        int id PK
        int condicion_id FK
        varchar campo_nutriente
        varchar color
        numeric umbral_min
        numeric umbral_max
        text descripcion
        smallint prioridad
        timestamptz created_at
    }

    clasificaciones_cache {
        int alimento_id FK
        int condicion_id FK
        varchar color
        text razon
        timestamptz calculado_en
    }

    %% RECETAS
    recetas {
        int id PK
        varchar nombre
        text descripcion
        text instrucciones
        smallint porciones
        smallint tiempo_min
        text imagen_url
        boolean activa
        timestamptz created_at
        timestamptz updated_at
    }

    receta_ingredientes {
        int id PK
        int receta_id FK
        int alimento_id FK
        numeric cantidad
        varchar unidad
        text notas
        timestamptz created_at
    }

    receta_condiciones {
        int receta_id FK
        int condicion_id FK
        varchar color_promedio
        timestamptz calculado_en
    }

    %% FAVORITOS Y BÚSQUEDAS
    favoritos_alimentos {
        uuid usuario_id FK
        int alimento_id FK
        timestamptz created_at
    }

    favoritos_recetas {
        uuid usuario_id FK
        int receta_id FK
        timestamptz created_at
    }

    historial_busquedas {
        bigint id PK
        uuid usuario_id FK
        varchar termino
        timestamptz created_at
    }

    %% RELACIONES
    grupos_alimentos ||--o{ alimentos : "contiene"
    alimentos ||--o{ clasificaciones_cache : "clasificado_en"
    condiciones_medicas ||--o{ usuario_condiciones : "asignada_a"
    condiciones_medicas ||--o{ reglas_semaforo : "regla_para"
    condiciones_medicas ||--o{ clasificaciones_cache : "por_condicion"
    condiciones_medicas ||--o{ receta_condiciones : "evaluada_en"
    profiles ||--o{ usuario_condiciones : "tiene"
    profiles ||--o{ favoritos_alimentos : "guarda"
    profiles ||--o{ favoritos_recetas : "guarda"
    profiles ||--o{ historial_busquedas : "registra"
    recetas ||--o{ receta_ingredientes : "contiene"
    recetas ||--o{ receta_condiciones : "evaluada_en"
    alimentos ||--o{ receta_ingredientes : "usado_en"
    recetas ||--o{ favoritos_recetas : "marcada"
```

---

## 2. Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant Vue as Vue.js (Frontend)
    participant Laravel as Laravel (Backend API)
    participant Supabase as Supabase (Auth + DB)

    %% AUTENTICACIÓN
    Note over Vue,Laravel: flujo 1: Registro/Login
    Vue->>Laravel: POST /api/auth/register
    Laravel->>Supabase: POST /auth/v1/signup
    Supabase-->>Laravel: { session, user }
    Laravel-->>Vue: { token, user }

    %% CONSULTA DE ALIMENTOS CON SEMÁFORO
    Note over Vue,Laravel: flujo 2: Consultar alimentos por grupo
    Vue->>Laravel: GET /api/alimentos?grupo=verduras
    Laravel->>Supabase: SELECT * FROM alimentos WHERE grupo_id = ?
    Supabase-->>Laravel: [alimentos...]
    Laravel->>Supabase: SELECT * FROM usuario_condiciones WHERE usuario_id = ?
    Supabase-->>Laravel: [condiciones...]
    Laravel->>Supabase: SELECT * FROM reglas_semaforo WHERE condicion_id IN (...)
    Supabase-->>Laravel: [reglas...]
    Note over Laravel: Calcular semáforo por cada alimento
    Laravel-->>Vue: { alimentos[], color_semaforo[] }

    %% BÚSQUEDA DE ALIMENTOS
    Note over Vue,Laravel: flujo 3: Búsqueda con historial
    Vue->>Laravel: GET /api/alimentos/search?q=pollo
    Laravel->>Supabase: INSERT historial_busquedas
    Laravel->>Supabase: SELECT * FROM alimentos WHERE nombre ILIKE '%pollo%'
    Supabase-->>Laravel: [resultados]
    Laravel-->>Vue: { resultados }

    %% GESTIÓN DE PERFIL Y CONDICIONES
    Note over Vue,Laravel: flujo 4: Actualizar condiciones médicas
    Vue->>Laravel: PUT /api/perfil/condiciones
    Laravel->>Supabase: UPDATE usuario_condiciones SET activa = ?
    Supabase-->>Laravel: OK
    Laravel->>Supabase: SELECT * FROM clasificaciones_cache WHERE condicion_id = ?
    Supabase-->>Laravel: [cache]
    Laravel-->>Vue: { mensaje: "Actualizado" }

    %% RECETAS
    Note over Vue,Laravel: flujo 5: Ver recetas recomendadas
    Vue->>Laravel: GET /api/recetas?condicion=diabetes_t2
    Laravel->>Supabase: SELECT r.*, rc.color_promedio FROM recetas r<br/>JOIN receta_condiciones rc ON r.id = rc.receta_id<br/>WHERE rc.condicion_id = ? AND r.activa = true
    Supabase-->>Laravel: [recetas]
    Laravel-->>Vue: { recetas[] }

    %% FAVORITOS
    Note over Vue,Laravel: flujo 6: Marcar/desmarcar favorito
    Vue->>Laravel: POST /api/favoritos/alimento
    Laravel->>Supabase: INSERT INTO favoritos_alimentos (usuario_id, alimento_id)
    Supabase-->>Laravel: OK
    Laravel-->>Vue: { mensaje: "Favorito guardado" }
```

---

## 3. Diagrama de Clases

```mermaid
classDiagram
    %% =============================================================================
    %% FRONTEND - VUE.JS + PINIA
    %% =============================================================================

    class AuthStore {
        +user: User | null
        +session: Session | null
        +isAuthenticated: boolean
        +loading: boolean
        +error: string | null
        +login(email, password): Promise~void~
        +register(email, password, nombre): Promise~void~
        +logout(): Promise~void~
        +fetchSession(): Promise~void~
    }

    class AlimentosStore {
        +alimentos: Alimento[]
        +alimentoActual: Alimento | null
        +grupos: GrupoAlimento[]
        +filtros: FiltrosBusqueda
        +loading: boolean
        +error: string | null
        +fetchAlimentos(grupoId?): Promise~void~
        +searchAlimentos(query): Promise~void~
        +getAlimentoById(id): Promise~void~
        +fetchGrupos(): Promise~void~
    }

    class RecetasStore {
        +recetas: Receta[]
        +recetaActual: Receta | null
        +ingredientesReceta: RecetaIngrediente[]
        +loading: boolean
        +error: string | null
        +fetchRecetas(filtros?): Promise~void~
        +fetchRecetasPorCondicion(condicionId): Promise~void~
    }

    class PerfilStore {
        +perfil: Perfil
        +condiciones: CondicionUsuario[]
        +condicionesDisponibles: CondicionMedica[]
        +loading: boolean
        +error: string | null
        +fetchPerfil(): Promise~void~
        +updatePerfil(data): Promise~void~
        +fetchCondiciones(): Promise~void~
    }

    class FavoritosStore {
        +alimentosFavoritos: Alimento[]
        +recetasFavoritas: Receta[]
        +loading: boolean
        +toggleAlimentoFavorito(alimentoId): Promise~void~
        +toggleRecetaFavorita(recetaId): Promise~void~
    }

    class HistorialStore {
        +busquedas: HistorialBusqueda[]
        +loading: boolean
        +addBusqueda(termino): Promise~void~
        +fetchHistorial(): Promise~void~
    }

    class User {
        +id: string
        +email: string
        +nombre?: string
    }

    class Alimento {
        +id: number
        +grupo_id: number
        +nombre: string
        +energia_kcal: number
        +proteina_g: number
        +lipidos_g: number
        +hidratos_carbono_g: number
        +azucar_g: number
        +fibra_g: number
        +sodio_mg: number
        +indice_glucemico: number
        +contiene_gluten: boolean
        +color_semaforo?: string
    }

    class GrupoAlimento {
        +id: number
        +nombre: string
        +descripcion: string
    }

    class Receta {
        +id: number
        +nombre: string
        +descripcion: string
        +instrucciones: string
        +porciones: number
        +tiempo_min: number
        +imagen_url: string
    }

    class RecetaIngrediente {
        +id: number
        +receta_id: number
        +alimento_id: number
        +cantidad: number
        +unidad: string
    }

    class Perfil {
        +id: string
        +nombre: string
        +fecha_nacimiento: string
        +sexo: 'M' | 'F' | 'O'
        +peso_kg: number
        +talla_cm: number
    }

    class CondicionMedica {
        +id: number
        +clave: string
        +nombre: string
        +descripcion: string
        +icono: string
    }

    class FiltrosBusqueda {
        +grupo_id?: number
        +texto?: string
        +semaforo?: 'verde' | 'amarillo' | 'rojo'
    }

    %% Controllers Laravel
    class AuthController {
        +register(Request): JsonResponse
        +login(Request): JsonResponse
        +logout(Request): JsonResponse
        +me(Request): JsonResponse
    }

    class AlimentoController {
        +index(Request): JsonResponse
        +show(int $id): JsonResponse
        +search(Request): JsonResponse
    }

    class RecetaController {
        +index(Request): JsonResponse
        +show(int $id): JsonResponse
        +porCondicion(Request): JsonResponse
    }

    class PerfilController {
        +show(Request): JsonResponse
        +update(Request): JsonResponse
        +updateCondiciones(Request): JsonResponse
    }

    class FavoritoController {
        +toggleAlimento(Request): JsonResponse
        +toggleReceta(Request): JsonResponse
    }

    %% Services Laravel
    class SemaforoService {
        +calcularColor(Alimento $alimento, array $condiciones): array
        +aplicarReglas(Alimento $alimento, Collection $reglas): array
    }

    class NutricionService {
        +calcularPorcion(Alimento $alimento, float $cantidad): array
        +sumarNutricion(array $ingredientes): array
    }

    %% Models Laravel
    class Alimento {
        +id: int
        +grupo_id: int
        +nombre: string
        +grupo(): BelongsTo
    }

    class Receta {
        +id: int
        +nombre: string
        +ingredientes(): HasMany
    }

    class RecetaIngrediente {
        +id: int
        +receta_id: int
        +alimento_id: int
        +alimento(): BelongsTo
    }

    class Profile {
        +id: UUID
        +nombre: string
        +condiciones(): BelongsToMany
    }

    class ReglaSemaforo {
        +id: int
        +condicion_id: int
        +campo_nutriente: string
        +color: string
    }

    class CondicionMedica {
        +id: int
        +clave: string
        +nombre: string
        +reglas(): HasMany
    }

    %% Relaciones Frontend
    AuthStore --* AlimentosStore
    AuthStore --* PerfilStore

    %% Relaciones Backend
    AuthController --> AuthService
    AlimentoController --> SemaforoService
    RecetaController --> NutricionService

    %% Model Relations
    Receta --> RecetaIngrediente
    RecetaIngrediente --> Alimento
    Profile --> CondicionMedica
    CondicionMedica --> ReglaSemaforo
```

---

## Instrucciones para Exportar a PNG

### Opción 1: Mermaid Live Editor
1. Copia solo el código dentro de las marcas ````mermaid`
2. Ve a https://mermaid.live/
3. Pega el código
4. Click en "Download PNG"

### Opción 2: VS Code
1. Instala la extensión "Mermaid Preview" o "Mermaid Diagram"
2. Abre este archivo en VS Code
3. Click derecho en el código Mermaid → "Export to PNG"

### Opción 3: Draw.io (diagrams.net)
1. Ve a https://app.diagrams.net/
2. Arrange → Insert → Advanced → Mermaid
3. Pega el código Mermaid
4. File → Export as → PNG