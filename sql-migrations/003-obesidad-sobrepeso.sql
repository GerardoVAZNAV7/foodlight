-- Agregar obesidad y sobrepeso como condiciones médicas auto-calculadas por IMC
INSERT INTO public.condiciones_medicas (clave, nombre, descripcion, icono)
SELECT 'obesidad', 'Obesidad', 'Índice de Masa Corporal ≥ 30 calculado automáticamente', '⚖️'
WHERE NOT EXISTS (SELECT 1 FROM public.condiciones_medicas WHERE clave = 'obesidad');

INSERT INTO public.condiciones_medicas (clave, nombre, descripcion, icono)
SELECT 'sobrepeso', 'Sobrepeso', 'Índice de Masa Corporal entre 25 y 29.9 calculado automáticamente', '⚖️'
WHERE NOT EXISTS (SELECT 1 FROM public.condiciones_medicas WHERE clave = 'sobrepeso');
