# Fundamentos AREVYS V2

Este documento es la fuente de verdad del producto. Reúne las decisiones trabajadas en **fundamentos Arevys** y en el desarrollo visual de la intro. Toda nueva pantalla, regla o función debe respetar estos fundamentos.

## 1. Qué es AREVYS

**AREVYS es un sistema operativo personal para el cuerpo.**

No es una biblioteca de ejercicios ni un contador de series. Interpreta el estado físico del usuario, estima qué puede progresar hoy y transforma esa información en una decisión clara, visual y explicable.

La pregunta que AREVYS debe responder cada día es:

> **¿Qué es lo mejor que puede hacer mi cuerpo hoy para acercarse a mi objetivo?**

Promesa de producto:

> **AREVYS entiende tu cuerpo y toma decisiones contigo.**

## 2. Diferenciador principal

El centro de AREVYS es el **Gemelo Digital**: Aquiles o Helena no intentan copiar físicamente al usuario. Son una representación biológica y visual de su estado corporal.

- Al terminar una sesión, el gemelo cambia según los músculos realmente estimulados.
- Verde, amarillo y rojo representan recuperación, adaptación y fatiga.
- Los cambios corporales de composición, postura, fuerza y definición ocurren lentamente y de modo creíble durante meses, nunca como una transformación instantánea.
- El gemelo permite ver estado actual, historial y posibles escenarios futuros.

El usuario debe sentir: “mi entrenamiento modificó mi cuerpo digital”.

## 3. Principios intransables

1. **El cuerpo es protagonista.** Aquiles/Helena ocupan el centro visual; la interfaz no compite con ellos.
2. **Una decisión debe ser explicable.** Si AREVYS recomienda algo, debe mostrar qué datos y razonamiento lo respaldan.
3. **Cálculos duros, IA humana.** Los motores deterministas calculan; la IA interpreta, conversa, contextualiza y explica.
4. **Simulaciones, no promesas.** Toda proyección física o de rendimiento se presenta como estimación basada en datos, nunca como resultado garantizado ni consejo médico.
5. **Modo vida real.** El sistema entiende semanas caóticas, baja la exigencia y protege la adherencia sin culpa.
6. **Diseño sobrio y premium.** Negro profundo, grafito, metal, espacio negativo, iluminación cinematográfica discreta. Verde/amarillo/rojo solo comunican estado corporal.
7. **Adherencia antes que perfección.** El sistema considera la disposición mental, estrés y contexto de vida sin juzgar. Si la energía o la motivación son bajas, adapta la propuesta y protege la continuidad; nunca castiga al usuario por una semana difícil.

## 4. Los cinco flujos de la app

### Onboarding

La intro audiovisual ya construida guía al usuario al crear su punto de partida: objetivo, experiencia, rutina, datos básicos, nutrición, cuidados y avatar. Cada respuesta avanza el recorrido. El usuario termina con Aquiles o Helena como su gemelo digital.

### Uso diario

La pantalla principal responde “¿cómo está mi cuerpo hoy?” y muestra:

- Preparación general.
- Gemelo digital con estado muscular.
- Sueño, recuperación y energía.
- Check-in breve de estado mental: energía percibida, estrés y disposición a entrenar.
- **Mejor oportunidad de entrenamiento** del día.
- Acceso a generar rutina y a AREVYS AI.

### Entrenar

La rutina debe ser simple durante la sesión: ejercicio, demostración, series, peso, repeticiones, RIR y músculos implicados. Registrar una serie es un evento que modifica el estado corporal.

### Evolución

Muestra progreso de fuerza, composición, constancia y recuperación. Incluye línea de tiempo y proyección: “si sigues igual” versus “siguiendo el plan AREVYS”.

### Conocimiento y configuración

Biblioteca de ejercicios con demostraciones, guías para entender métricas, perfil, biometría, objetivos, conexiones y preferencias.

## 5. Pantallas esenciales de la primera versión

1. Intro / creación de punto de partida.
2. Home: preparación de hoy + oportunidad de entrenamiento.
3. Plan inteligente: rutina sugerida y explicación.
4. Entrenamiento activo.
5. Resultado post-entrenamiento: actualización corporal y próximo plan.
6. Mapa muscular interactivo, frontal y posterior.
7. Historial de recuperación por músculo.
8. Evolución / gemelo digital / línea de tiempo.
9. Biblioteca de ejercicios.
10. AREVYS AI contextual.
11. Perfil, objetivos y conexiones.

## 6. Estado corporal y mapa muscular

Cada músculo controlado mantiene como mínimo:

- Nivel de recuperación actual.
- Fatiga aguda y acumulada.
- Último estímulo y carga reciente.
- Tiempo estimado de recuperación.
- Tendencia y riesgo de sobrecarga.
- Nivel de confianza de la estimación según los datos disponibles.

Estados visuales:

- **Verde — óptimo:** disponible para progresar.
- **Amarillo — atención:** recuperación en curso; conviene moderar carga o priorizar descanso.
- **Rojo — fatiga:** no es la mejor oportunidad de estímulo.

No se colorea nada al inicio si no existe actividad registrada. El estado aparece al registrar sesiones y se actualiza con recuperación real/estimada.

## 7. Arquitectura funcional

```text
Usuario → App → API / Orquestador
                     ↓
  Ejercicios · Biométrico · Recuperación · Nutrición · Objetivos · Biblioteca
                     ↓
               Motor predictivo
                     ↓
                  Motor de IA
                     ↓
              Motor de decisiones
                     ↓
        Gemelo digital + interfaz + recomendaciones
```

### Orquestador central

Coordina; no calcula ni decide. Escucha eventos como “serie registrada”, “entrenamiento terminado” o “nuevo dato de sueño”, activa los motores necesarios y compone un estado global del usuario.

### Motor de ejercicios

Conoce la biblioteca, músculos primarios/secundarios, series, repeticiones, peso, RIR, volumen e intensidad.

### Motor de fatiga y recuperación

Traduce la carga de una sesión en efecto muscular local y sistémico; estima recuperación según historial y velocidad de recuperación individual.

### Motor predictivo

Entrega escenarios y probabilidades: riesgo de sobrecarga, estancamiento, oportunidad de rendimiento y consecuencias de mantener una tendencia. No presenta certezas.

### Motor de decisiones

Convierte datos en acciones: recomendar rutina, reducir volumen, proponer movilidad, reorganizar la semana o sugerir descanso. Cada decisión debe guardar su explicación y confianza.

### AREVYS AI

No calcula porcentajes de recuperación. Lee el estado global, entiende el contexto y responde preguntas como “¿qué entreno hoy?” o “¿por qué no me conviene hacer pecho?”. Debe ser útil sin ser invasiva y su costo debe escalar de manera controlada.

### Capa de adherencia y contexto

El entrenamiento también es psicológico. Antes de recomendar una sesión, AREVYS puede recibir un check-in opcional y breve: energía percibida, estrés, ánimo y tiempo disponible. Esta capa:

- No diagnostica ni etiqueta emocionalmente al usuario.
- No modifica por sí sola la recuperación muscular calculada.
- Sí contextualiza la decisión: acorta una sesión, reduce complejidad, ofrece movilidad o propone descanso activo cuando corresponde.
- Explica con tono de apoyo: “Hoy podemos mantener el hábito sin exigir de más”.

## 8. Contrato de estado vivo

La interfaz nunca debe depender de capturas estáticas. Cada elemento visible se deriva de un estado local o remoto versionado.

```text
UserProfile
  objetivo · experiencia · preferencias · avatar

DailyContext
  sueño · energía · estrés · disposición · tiempo disponible

MuscleState
  recuperación · fatigaAguda · fatigaAcumulada · últimoEstímulo
  cargaReciente · tendencia · riesgo · confianza

WorkoutEvent
  ejercicio · series · repeticiones · peso · RIR · duración
  músculosPrimarios · músculosSecundarios

Decision
  acción · explicación · confianza · alternativas · momentoDeCálculo
```

Un evento de entrenamiento recalcula `MuscleState`; de él se alimentan el mapa, Home, oportunidad del día, historial y la explicación de AREVYS AI. El avatar y los colores son consecuencias visuales de ese estado, nunca datos manuales aislados.

## 9. Dirección visual de producto

La referencia es una aplicación real, no una ilustración de fitness:

- Minimalismo de producto inspirado en Apple, Tesla y Whoop: información precisa, aire y una decisión importante por pantalla.
- Fondo negro mate y capas grafito; metal/dorado para identidad AREVYS; verde, amarillo y rojo exclusivamente para estados corporales.
- El Gemelo Digital ocupa el protagonismo y se mantiene reconocible, anatómicamente cuidado y libre de fondos rectangulares.
- Iconos, gráficos y porcentajes deben ser componentes independientes, editables y reactivos al estado.
- No usar una estética gamer, cyberpunk ni efectos luminosos innecesarios.

## 10. Evento clave: entrenamiento terminado

1. Se registran ejercicios, series, repeticiones, peso, RIR y duración.
2. El motor de ejercicios identifica músculos primarios y secundarios.
3. El motor de fatiga actualiza carga local y sistémica.
4. El motor de recuperación recalcula porcentajes y tiempos estimados.
5. El predictivo revisa riesgos y oportunidades futuras.
6. El motor de decisiones ajusta el plan si corresponde.
7. El gemelo digital, el mapa, el Home y el historial se actualizan.
8. AREVYS AI explica el cambio solo cuando aporta valor o el usuario pregunta.

## 11. Producto y negocio

- La propuesta no compite solo por precio: compite por ser más valiosa y explicable que un simple registro de ejercicios.
- Referencia inicial de plan: alrededor de **$9.990 CLP al mes**, con un plan esencial fuerte y futura capa Pro opcional.
- La IA se usa selectivamente; la inteligencia cotidiana viene de los motores propios.
- La adquisición se apoya primero en contenido orgánico: el gemelo digital y preguntas como “¿qué oportunidad tiene tu cuerpo hoy?”.
- La retención se construye con progreso visible, decisiones útiles, transparencia y adherencia emocional.

## 12. Comunicación y tono

- “Tu cuerpo digital evoluciona contigo.”
- “No te decimos solo qué hacer: entendemos por qué.”
- “Tu mejor oportunidad de entrenamiento hoy.”
- “La recuperación también es progreso.”

Nunca usar culpa, promesas físicas irreales ni lenguaje médico concluyente.

## 13. Orden de construcción de AREVYS V2

1. Mantener la intro terminada.
2. Definir el modelo de datos local y el estado global del usuario.
3. Construir Home con preparación y oportunidad de hoy.
4. Construir biblioteca + registro de entrenamiento.
5. Conectar registro → fatiga → recuperación → mapa muscular.
6. Construir post-entrenamiento e historial.
7. Añadir evolución y escenarios predictivos.
8. Integrar AREVYS AI contextual.
9. Conectar biometría/wearables cuando los motores base sean confiables.
10. Probar localmente, validar con usuarios y recién publicar.
