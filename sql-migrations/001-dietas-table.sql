-- Crear tabla dietas (para especialistas)
CREATE SEQUENCE IF NOT EXISTS public.dietas_id_seq;

CREATE TABLE IF NOT EXISTS public.dietas (
  id integer NOT NULL DEFAULT nextval('dietas_id_seq'::regclass),
  especialista_id uuid NOT NULL,
  paciente_id uuid,
  nombre character varying NOT NULL,
  descripcion text,
  kcal_objetivo numeric,
  duracion_dias smallint,
  prot_g numeric,
  carbs_g numeric,
  grasas_g numeric,
  fibra_g numeric,
  notas text,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dietas_pkey PRIMARY KEY (id),
  CONSTRAINT dietas_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES public.profiles(id),
  CONSTRAINT dietas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.profiles(id)
);

-- Política RLS: especialistas pueden todo sobre sus dietas
ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Especialistas insert own diets"
  ON public.dietas FOR INSERT
  WITH CHECK (especialista_id = auth.uid());

CREATE POLICY "Especialistas view own diets"
  ON public.dietas FOR SELECT
  USING (especialista_id = auth.uid());

CREATE POLICY "Especialistas update own diets"
  ON public.dietas FOR UPDATE
  USING (especialista_id = auth.uid());

CREATE POLICY "Especialistas delete own diets"
  ON public.dietas FOR DELETE
  USING (especialista_id = auth.uid());

-- También puede faltar la columna 'apellido' en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS apellido character varying;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS especialidad character varying;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cedula character varying;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono character varying;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institucion character varying;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS descripcion text;
