-- Política RLS: pacientes pueden ver sus propias dietas asignadas
CREATE POLICY "Pacientes view own assigned diets"
  ON public.dietas FOR SELECT
  USING (paciente_id = auth.uid());
