/**
 * Per-exercise guidance (how to perform it, coaching tips, muscles worked) for the exercises this
 * app ships, derived from the RepDB free-tier dataset and keyed by our own exercise name.
 *
 * Attribution is required by that licence and is shown in Settings → About.
 *
 * 6 of our exercises have no entry — RepDB has no equivalent movement, or only a
 * differently-loaded one whose cues would be wrong here, so they show no guide rather than a
 * misleading one: Cable Crossover, Trap Bar Deadlift, Reverse Pec Deck, Sissy Squat, Triceps Dip, Leg Press Calf Raise.
 *
 * Generated, not hand-edited: regenerate rather than patching entries by hand.
 */
export type ExerciseGuide = {
  description: string;
  instructions: string[];
  tips: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficulty: string | null;
  mechanic: string | null;
  equipment: string | null;
};

const GUIDES: Record<string, ExerciseGuide> = {
  "Barbell Bench Press": {
    "description": "A compound pushing movement that targets the chest, shoulders, and triceps.",
    "instructions": [
      "Lie flat on a bench with your eyes under the bar.",
      "Grip the bar slightly wider than shoulder-width.",
      "Unrack the bar and lower it to your mid-chest.",
      "Press the bar back up to full arm extension.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Keep your feet flat on the floor.",
      "Maintain a slight arch in your lower back.",
      "Drive through your legs for stability."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Incline Barbell Bench Press": {
    "description": "A barbell pressing movement on an incline bench targeting the upper chest.",
    "instructions": [
      "Lie on an incline bench set to 30-45 degrees.",
      "Grip the bar slightly wider than shoulder-width and unrack.",
      "Lower the bar to your upper chest.",
      "Press the bar back up to full extension.",
      "Repeat."
    ],
    "tips": [
      "Keep your shoulder blades pinched together against the bench.",
      "Lower the bar without bouncing it off your chest.",
      "Keep your feet planted and your glutes on the bench."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Dumbbell Bench Press": {
    "description": "A compound chest exercise using dumbbells, allowing a greater range of motion than the barbell bench press.",
    "instructions": [
      "Lie on a flat bench holding a dumbbell in each hand at chest level.",
      "Press the dumbbells up until your arms are fully extended.",
      "Lower them slowly back to the start.",
      "Repeat."
    ],
    "tips": [
      "Keep wrists neutral throughout.",
      "Squeeze your chest at the top of the movement."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dumbbell"
  },
  "Incline Dumbbell Press": {
    "description": "An incline pressing movement emphasizing the upper chest.",
    "instructions": [
      "Set bench to 30-degree incline and sit back with dumbbells at shoulder level.",
      "Press dumbbells up and together until arms are fully extended.",
      "Lower dumbbells back to shoulder level with control.",
      "Repeat."
    ],
    "tips": [
      "Keep your wrists stacked directly over your elbows.",
      "Press up without banging the dumbbells together at the top.",
      "Keep your shoulder blades pulled back against the bench."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dumbbell"
  },
  "Decline Barbell Bench Press": {
    "description": "A barbell compound press on a decline bench emphasizing the lower chest.",
    "instructions": [
      "Set the bench to a decline angle. Lie down and secure your feet.",
      "Grip the bar slightly wider than shoulder-width.",
      "Lower the bar to your lower chest, then press back up.",
      "Repeat."
    ],
    "tips": [
      "Control the descent.",
      "Keep elbows at about 45 degrees to the torso."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Dumbbell Fly": {
    "description": "An isolation exercise that stretches and contracts the pectorals through a wide arc of motion.",
    "instructions": [
      "Lie flat on a bench with dumbbells held above your chest, palms facing each other.",
      "With a slight bend in the elbows, lower the dumbbells out to the sides.",
      "Return to the start by squeezing your chest.",
      "Repeat."
    ],
    "tips": [
      "Keep a consistent bend in the elbows throughout.",
      "Do not let the dumbbells go too low."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Cable Fly": {
    "description": "An isolation movement for the chest using cable resistance for constant tension.",
    "instructions": [
      "Stand between two cable columns with handles attached to high pulleys.",
      "With a slight bend in your elbows, open your arms wide.",
      "Bring your hands together in front of your chest in a hugging motion.",
      "Slowly return to the starting position.",
      "Repeat."
    ],
    "tips": [
      "Maintain the same elbow bend throughout; do not press the weight.",
      "Step one foot forward for a stable, balanced stance.",
      "Control the stretch; do not let the cables yank your arms back."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Push-Up": {
    "description": "A fundamental bodyweight exercise for the chest, shoulders, and triceps.",
    "instructions": [
      "Start in a high plank position with hands shoulder-width apart.",
      "Lower your body until your chest nearly touches the floor.",
      "Push back up to the starting position.",
      "Keep your body in a straight line throughout.",
      "Repeat."
    ],
    "tips": [
      "Tuck your elbows toward your body rather than flaring them out wide.",
      "Brace your core and squeeze your glutes to prevent sagging hips.",
      "Keep your neck neutral by gazing slightly ahead of your hands."
    ],
    "primaryMuscles": [
      "Pectoralis major",
      "Triceps brachii"
    ],
    "secondaryMuscles": [
      "Anterior deltoid"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": null
  },
  "Chest Dip": {
    "description": "A compound bodyweight exercise targeting the lower chest and triceps.",
    "instructions": [
      "Grip parallel dip bars and lift yourself to the top position with arms locked.",
      "Lean your torso forward slightly.",
      "Lower your body by bending your elbows until shoulders are below elbows.",
      "Press back up to the starting position.",
      "Repeat."
    ],
    "tips": [
      "Keep your shoulders pulled down away from your ears.",
      "Bend your knees and cross your ankles to minimize swinging.",
      "Stop the descent if you feel pinching in your shoulders."
    ],
    "primaryMuscles": [
      "Pectoralis major",
      "Triceps brachii"
    ],
    "secondaryMuscles": [
      "Anterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dip_station"
  },
  "Machine Chest Press": {
    "description": "A machine-based pressing movement for the chest, ideal for beginners.",
    "instructions": [
      "Sit in the machine with your back flat against the pad.",
      "Grip the handles at chest level.",
      "Push the handles forward until your arms are fully extended.",
      "Slowly return to the starting position.",
      "Repeat."
    ],
    "tips": [
      "Adjust the seat so the handles line up with mid-chest.",
      "Keep your shoulder blades pulled back against the pad as you press.",
      "Press to full extension without forcefully locking your elbows."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": "chest_press_machine"
  },
  "Pec Deck": {
    "description": "A chest isolation machine with swinging handles that targets the pectorals through horizontal adduction.",
    "instructions": [
      "Sit in the pec deck machine and grip the handles with your arms out to the sides, elbows slightly bent.",
      "Adjust the seat so the handles align with mid-chest height.",
      "Squeeze the handles together in front of your chest.",
      "Hold the contraction briefly at the center.",
      "Return under control to the starting position.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Keep your shoulders down and back against the seat.",
      "Avoid letting the handles fly back past a comfortable stretch.",
      "Focus on squeezing your chest rather than pressing with your arms."
    ],
    "primaryMuscles": [
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Serratus anterior"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "pec_deck"
  },
  "Deadlift": {
    "description": "A full-body compound lift that primarily targets the posterior chain.",
    "instructions": [
      "Stand with feet hip-width apart, bar over mid-foot.",
      "Hinge at the hips and grip the bar.",
      "Brace your core and lift by extending hips and knees.",
      "Stand tall at the top, then lower under control.",
      "Repeat."
    ],
    "tips": [
      "Keep the bar close to your body.",
      "Do not round your lower back."
    ],
    "primaryMuscles": [
      "Erector spinae",
      "Gluteus maximus",
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Quadriceps",
      "Trapezius"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Sumo Deadlift": {
    "description": "A deadlift variation with a wide stance that shifts emphasis to the glutes, quads, and inner thighs.",
    "instructions": [
      "Stand with feet wider than shoulder-width, toes pointed outward.",
      "Grip the bar between your legs.",
      "Brace your core and drive through your heels to stand.",
      "Lower under control.",
      "Repeat."
    ],
    "tips": [
      "Keep the bar close to your body.",
      "Push your knees out in line with your toes."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Erector spinae",
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Barbell Row": {
    "description": "A compound pulling movement that targets the upper and middle back.",
    "instructions": [
      "Hinge at the hips with a slight knee bend.",
      "Grip the bar slightly wider than shoulder-width.",
      "Pull the bar to your lower chest, squeezing your shoulder blades.",
      "Lower the bar under control.",
      "Repeat."
    ],
    "tips": [
      "Keep your torso at roughly 45 degrees.",
      "Do not use momentum to swing the weight."
    ],
    "primaryMuscles": [
      "Latissimus dorsi",
      "Rhomboids"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Posterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Pendlay Row": {
    "description": "A strict barbell row performed from a dead stop on the floor between reps, torso parallel to the ground. Popularized by coach Glenn Pendlay.",
    "instructions": [
      "Load a barbell and set it on the floor.",
      "Hinge at the hips until your torso is parallel to the ground, knees slightly bent.",
      "Grip the bar slightly wider than shoulder-width with an overhand grip.",
      "Explosively pull the bar to your lower chest.",
      "Lower the bar back to the floor under control and pause before the next rep.",
      "Repeat."
    ],
    "tips": [
      "Dead-stop each rep on the floor — no touch-and-go.",
      "Keep your torso locked at roughly 90 degrees; do not use body english.",
      "Drive the elbows up and back, not out to the sides."
    ],
    "primaryMuscles": [
      "Latissimus dorsi",
      "Rhomboids",
      "Trapezius"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Erector spinae",
      "Posterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Pull-Up": {
    "description": "A bodyweight compound pull targeting the lats and biceps.",
    "instructions": [
      "Hang from a bar with an overhand grip, slightly wider than shoulder-width.",
      "Pull yourself up until your chin is over the bar.",
      "Lower yourself under control to a dead hang.",
      "Repeat."
    ],
    "tips": [
      "Avoid swinging or kipping.",
      "Engage your lats by pulling your elbows down."
    ],
    "primaryMuscles": [
      "Latissimus dorsi"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Posterior deltoid",
      "Rhomboids"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "pull_up_bar"
  },
  "Chin-Up": {
    "description": "A supinated-grip pull-up that strongly activates the biceps alongside the lats.",
    "instructions": [
      "Hang from a bar with a shoulder-width underhand grip.",
      "Pull yourself up until chin is above the bar.",
      "Lower under control.",
      "Repeat."
    ],
    "tips": [
      "Keep the core tight throughout.",
      "Avoid excessive swinging."
    ],
    "primaryMuscles": [
      "Biceps brachii",
      "Latissimus dorsi"
    ],
    "secondaryMuscles": [
      "Rhomboids"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "pull_up_bar"
  },
  "Lat Pulldown": {
    "description": "A cable machine exercise targeting the latissimus dorsi.",
    "instructions": [
      "Sit at the lat pulldown machine with thighs secured under the pads.",
      "Grip the wide bar with an overhand grip.",
      "Pull the bar down to your upper chest, squeezing your lats.",
      "Slowly return the bar to the starting position.",
      "Repeat."
    ],
    "tips": [
      "Drive your elbows down and back rather than pulling with your hands.",
      "Avoid leaning far back or using momentum to move the weight.",
      "Keep your chest lifted and shoulders down away from your ears."
    ],
    "primaryMuscles": [
      "Latissimus dorsi"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Posterior deltoid",
      "Rhomboids"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": "cable"
  },
  "Seated Cable Row": {
    "description": "A back exercise performed on a cable row machine, pulling a handle toward the torso while seated.",
    "instructions": [
      "Sit at the cable row station and place your feet on the footrests.",
      "Grip the handle and sit upright with a slight forward lean.",
      "Drive your elbows back and pull the handle toward your lower abdomen.",
      "Squeeze your shoulder blades together at the end of the pull.",
      "Extend your arms under control back to the starting position.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Keep your torso upright with minimal rocking.",
      "Drive your elbows straight back, not out to the sides.",
      "Squeeze your shoulder blades together at the end of the pull."
    ],
    "primaryMuscles": [
      "Latissimus dorsi",
      "Rhomboids"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Erector spinae",
      "Posterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "cable"
  },
  "Single-Arm Dumbbell Row": {
    "description": "A unilateral back exercise using a dumbbell for balanced development.",
    "instructions": [
      "Place one knee and hand on a bench for support.",
      "Hold a dumbbell in the other hand with arm extended.",
      "Pull the dumbbell up toward your hip, squeezing your shoulder blade.",
      "Lower the dumbbell with control.",
      "Repeat on both sides."
    ],
    "tips": [
      "Avoid rotating the torso to hoist the weight higher.",
      "Let your arm extend fully at the bottom for a complete stretch.",
      "Keep your back flat from head to hips throughout the set."
    ],
    "primaryMuscles": [
      "Latissimus dorsi",
      "Rhomboids"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Posterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dumbbell"
  },
  "T-Bar Row": {
    "description": "A compound row performed straddling a loaded T-bar, building thickness in the lats and rhomboids.",
    "instructions": [
      "Straddle the loaded T-bar with feet shoulder-width apart.",
      "Hinge at the hips until your torso is around 45 degrees.",
      "Grip the handles and keep your back flat.",
      "Pull the bar up toward your chest by driving your elbows back.",
      "Squeeze your shoulder blades at the top.",
      "Lower the bar under control and repeat."
    ],
    "tips": [
      "Keep your hips fixed and avoid heaving the torso upright.",
      "Maintain a soft bend in your knees to protect the lower back.",
      "Let the weight stretch your lats fully at the bottom."
    ],
    "primaryMuscles": [
      "Latissimus dorsi",
      "Rhomboids"
    ],
    "secondaryMuscles": [
      "Biceps brachii",
      "Erector spinae",
      "Trapezius"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Face Pull": {
    "description": "A cable exercise targeting the rear deltoids and external rotators.",
    "instructions": [
      "Attach a rope to a high cable pulley.",
      "Pull the rope toward your face, separating the ends.",
      "Squeeze your rear deltoids and external rotators.",
      "Return to the starting position with control.",
      "Repeat."
    ],
    "tips": [
      "Keep your elbows high, roughly in line with your shoulders.",
      "Choose a light weight and prioritize control over load.",
      "Avoid leaning back or shrugging your shoulders as you pull."
    ],
    "primaryMuscles": [
      "Posterior deltoid",
      "Rhomboids"
    ],
    "secondaryMuscles": [
      "Trapezius"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": "cable"
  },
  "Straight-Arm Pulldown": {
    "description": "An isolation exercise for the lats using a cable with arms kept straight.",
    "instructions": [
      "Stand facing a cable machine with a straight bar attached to the high pulley.",
      "With arms nearly straight, push the bar down in an arc toward your thighs.",
      "Squeeze your lats at the bottom.",
      "Slowly return the bar to the starting position.",
      "Repeat."
    ],
    "tips": [
      "Maintain a slight elbow bend without turning the movement into a pressdown.",
      "Hinge slightly at the hips and keep your back flat.",
      "Avoid using body momentum to swing the bar down."
    ],
    "primaryMuscles": [
      "Latissimus dorsi"
    ],
    "secondaryMuscles": [
      "Posterior deltoid",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Overhead Press": {
    "description": "A compound overhead pressing movement targeting the shoulders and triceps.",
    "instructions": [
      "Stand with feet shoulder-width apart, bar at collarbone level.",
      "Brace your core and press the bar overhead.",
      "Lock out at the top with the bar over your mid-foot.",
      "Lower the bar back to collarbone height.",
      "Repeat."
    ],
    "tips": [
      "Do not lean back excessively.",
      "Squeeze your glutes for stability."
    ],
    "primaryMuscles": [
      "Anterior deltoid",
      "Lateral deltoid"
    ],
    "secondaryMuscles": [
      "Trapezius",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Dumbbell Shoulder Press": {
    "description": "An overhead press with dumbbells performed seated or standing, building the front and side delts.",
    "instructions": [
      "Sit or stand holding dumbbells at shoulder height, palms facing forward.",
      "Press both dumbbells overhead until arms are fully extended.",
      "Keep your core braced and avoid arching your lower back.",
      "Lower the dumbbells under control back to shoulder height.",
      "Do not let the dumbbells drift behind your head.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Stack your wrists directly over your elbows throughout the press.",
      "Exhale as you press up and inhale as you lower.",
      "Keep your elbows slightly in front of your shoulders rather than flared wide."
    ],
    "primaryMuscles": [
      "Anterior deltoid",
      "Lateral deltoid"
    ],
    "secondaryMuscles": [
      "Trapezius",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dumbbell"
  },
  "Arnold Press": {
    "description": "An overhead press variation rotating the palms from facing the body to facing forward, working the front and side deltoids.",
    "instructions": [
      "Hold a pair of dumbbells at shoulder height with palms facing you.",
      "Press the dumbbells overhead while rotating your palms to face forward.",
      "Fully extend your arms at the top without locking the elbows.",
      "Reverse the motion and rotate back to the start.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Time the palm rotation evenly throughout the press, not all at once.",
      "Avoid arching your lower back as the weight goes overhead.",
      "Use a lighter load than a standard press to control the rotation."
    ],
    "primaryMuscles": [
      "Anterior deltoid",
      "Lateral deltoid"
    ],
    "secondaryMuscles": [
      "Serratus anterior",
      "Trapezius",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dumbbell"
  },
  "Landmine Press": {
    "description": "A two-handed shoulder press using one end of a barbell anchored in a landmine attachment, allowing a natural arc that is easier on the shoulder joint.",
    "instructions": [
      "Load one end of a barbell into a landmine attachment and load the other end with a plate.",
      "Stand in a staggered or square stance and cup the sleeve end of the barbell in both hands at chest height.",
      "Brace your core and press the bar forward and upward along its natural arc.",
      "Fully extend your arms without locking the elbows, then lower the bar back under control.",
      "Keep both hands on the bar throughout and repeat for the desired number of reps."
    ],
    "tips": [
      "Keep your torso upright and avoid leaning excessively into the press.",
      "The angled path makes it more shoulder-friendly than a strict overhead press.",
      "Use a push-press leg drive for heavier loads."
    ],
    "primaryMuscles": [
      "Anterior deltoid",
      "Pectoralis major"
    ],
    "secondaryMuscles": [
      "Serratus anterior",
      "Triceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Lateral Raise": {
    "description": "An isolation movement targeting the lateral deltoid for shoulder width.",
    "instructions": [
      "Stand holding dumbbells at your sides.",
      "Raise the dumbbells out to the sides until arms are parallel to the floor.",
      "Lower under control.",
      "Repeat."
    ],
    "tips": [
      "Slight bend in the elbows.",
      "Lead with your elbows, not your hands."
    ],
    "primaryMuscles": [
      "Lateral deltoid"
    ],
    "secondaryMuscles": [
      "Anterior deltoid"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Cable Lateral Raise": {
    "description": "A unilateral lateral raise on the cable, providing constant tension on the side delt.",
    "instructions": [
      "Stand sideways to a low pulley and grip the handle with the hand farther from the machine.",
      "Keep a soft bend in the elbow and let the cable run across the front of your body.",
      "Raise the arm out to the side until parallel to the floor.",
      "Lower under control. Complete reps per side, then switch.",
      "Maintain tension — do not let the weight rest at the bottom."
    ],
    "tips": [
      "Lead with the elbow, not the hand.",
      "Pause briefly at the top, do not swing.",
      "Use a lighter load than for dumbbell — cable tension is constant."
    ],
    "primaryMuscles": [
      "Lateral deltoid"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Trapezius"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Front Raise": {
    "description": "An isolation exercise targeting the anterior deltoid through a forward raise motion.",
    "instructions": [
      "Stand with dumbbells at your sides, palms facing your thighs.",
      "Raise one or both dumbbells forward to shoulder height.",
      "Lower under control.",
      "Repeat."
    ],
    "tips": [
      "Avoid using momentum.",
      "Slight elbow bend reduces joint stress."
    ],
    "primaryMuscles": [
      "Anterior deltoid"
    ],
    "secondaryMuscles": [
      "Lateral deltoid"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Rear Delt Fly": {
    "description": "An isolation movement targeting the posterior deltoids and upper back.",
    "instructions": [
      "Hold dumbbells and hinge forward at the hips.",
      "With a slight bend in elbows, raise the dumbbells out to the sides.",
      "Squeeze your shoulder blades at the top.",
      "Lower with control.",
      "Repeat."
    ],
    "tips": [
      "Choose a light weight to keep the movement strict.",
      "Avoid using momentum from the torso to swing the weights up.",
      "Lead with your elbows rather than your hands."
    ],
    "primaryMuscles": [
      "Posterior deltoid",
      "Rhomboids"
    ],
    "secondaryMuscles": [
      "Trapezius"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Upright Row": {
    "description": "A compound pulling movement for the lateral deltoids and upper traps.",
    "instructions": [
      "Stand holding a barbell with a shoulder-width overhand grip.",
      "Pull the bar straight up along your body toward your chin.",
      "Lead with your elbows, keeping them above your hands.",
      "Lower the bar with control.",
      "Repeat."
    ],
    "tips": [
      "Use a lighter weight if you feel pinching in your shoulders.",
      "Avoid bending your wrists excessively as the bar rises.",
      "Avoid swinging or using your legs to heave the weight up."
    ],
    "primaryMuscles": [
      "Lateral deltoid",
      "Trapezius"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Biceps brachii"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Barbell Shrug": {
    "description": "An isolation movement for the upper trapezius.",
    "instructions": [
      "Stand holding a barbell at arm's length with an overhand grip.",
      "Shrug your shoulders straight up toward your ears.",
      "Hold briefly at the top.",
      "Lower your shoulders back down with control.",
      "Repeat."
    ],
    "tips": [
      "Avoid rolling the shoulders forward or backward at the top.",
      "Keep your arms relaxed and let the traps do the work.",
      "Keep your neck neutral instead of jutting the chin forward."
    ],
    "primaryMuscles": [
      "Trapezius"
    ],
    "secondaryMuscles": [
      "Rhomboids"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "barbell"
  },
  "Dumbbell Shrug": {
    "description": "A dumbbell shrug targeting the upper trapezius for neck and upper back thickness.",
    "instructions": [
      "Stand holding dumbbells at your sides.",
      "Shrug your shoulders straight up as high as possible.",
      "Hold briefly, then lower.",
      "Repeat."
    ],
    "tips": [
      "Do not roll your shoulders.",
      "Focus on squeezing the traps at the top."
    ],
    "primaryMuscles": [
      "Trapezius"
    ],
    "secondaryMuscles": [
      "Rhomboids"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Back Squat": {
    "description": "A compound lower-body movement targeting the quadriceps, glutes, and hamstrings.",
    "instructions": [
      "Position the bar on your upper traps.",
      "Unrack and step back, feet shoulder-width apart.",
      "Brace your core and squat down until thighs are parallel.",
      "Drive through your heels to stand back up.",
      "Repeat."
    ],
    "tips": [
      "Keep your chest up throughout the movement.",
      "Push your knees out in line with your toes."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Erector spinae",
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Front Squat": {
    "description": "A barbell squat with the bar held in front on the deltoids, emphasizing quads and core.",
    "instructions": [
      "Clean or rack the bar to your front deltoids with elbows high.",
      "Squat down keeping torso upright until thighs are parallel.",
      "Drive back up.",
      "Repeat."
    ],
    "tips": [
      "Maintain high elbows to keep the bar stable.",
      "A more upright torso increases quad activation."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Erector spinae",
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Leg Press": {
    "description": "A machine-based compound movement for the quads and glutes.",
    "instructions": [
      "Sit in the leg press machine with feet shoulder-width apart on the platform.",
      "Release the safety catches and lower the platform by bending your knees.",
      "Push the platform back up until legs are nearly straight.",
      "Do not lock your knees at the top.",
      "Repeat."
    ],
    "tips": [
      "Keep your lower back and hips pressed into the seat.",
      "Lower only as far as you can without your hips tucking under.",
      "Drive evenly through your whole foot, not just your toes."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": "leg_press"
  },
  "Hack Squat": {
    "description": "A compound lower-body machine exercise on the hack squat sled, targeting the quadriceps through a guided squat pattern.",
    "instructions": [
      "Load the hack squat machine and step on, positioning your back and shoulders against the pads.",
      "Place your feet shoulder-width on the platform with toes turned out slightly.",
      "Unlock the safety handles and lower the sled by bending at the knees and hips.",
      "Descend until your thighs are at least parallel to the platform.",
      "Drive through your heels to extend the legs and push the sled back to the start.",
      "Re-engage the safety handles after your final rep."
    ],
    "tips": [
      "Keep your lower back pressed against the pad throughout the movement.",
      "Placing the feet higher on the platform shifts emphasis to the glutes and hamstrings.",
      "Control the descent; do not bounce out of the bottom position."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Gastrocnemius",
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "hack_squat"
  },
  "Leg Extension": {
    "description": "An isolation exercise for the quadriceps using a machine.",
    "instructions": [
      "Sit in the leg extension machine with ankles behind the pad.",
      "Extend your legs until they are straight.",
      "Squeeze your quads at the top.",
      "Lower with control.",
      "Repeat."
    ],
    "tips": [
      "Adjust the seat so your knees align with the machine's pivot point.",
      "Keep your back pressed against the pad throughout.",
      "Avoid swinging the weight up with momentum."
    ],
    "primaryMuscles": [
      "Quadriceps"
    ],
    "secondaryMuscles": [],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "leg_extension"
  },
  "Bulgarian Split Squat": {
    "description": "A single-leg squat variation with the rear foot elevated.",
    "instructions": [
      "Stand in front of a bench, place one foot behind you on the bench.",
      "Hold dumbbells at your sides.",
      "Lower your body until your front thigh is parallel to the floor.",
      "Push through your front heel to stand back up.",
      "Repeat on both sides."
    ],
    "tips": [
      "Keep most of your weight on the front leg.",
      "Track your front knee over your toes without letting it cave inward.",
      "Square your hips forward and avoid rotating toward the bench."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "dumbbell"
  },
  "Walking Lunge": {
    "description": "A traveling lunge stepping forward leg over leg, training the quads and glutes with an added balance challenge.",
    "instructions": [
      "Stand tall with feet hip-width apart and hands on hips.",
      "Step one foot forward into a long lunge.",
      "Lower until both knees are around 90 degrees.",
      "Drive through the front heel and step the back foot forward.",
      "Continue alternating legs as you walk forward.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Lower until both knees reach about 90 degrees.",
      "Keep your torso upright as you step.",
      "Drive through your front heel to step forward smoothly."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Gluteus medius",
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": null
  },
  "Goblet Squat": {
    "description": "A beginner-friendly squat with a kettlebell held at chest height for improved posture and depth.",
    "instructions": [
      "Hold a kettlebell at chest height with both hands.",
      "Squat down keeping the weight close to your chest.",
      "Drive back up.",
      "Repeat."
    ],
    "tips": [
      "The goblet position naturally encourages an upright torso.",
      "Push knees out at the bottom."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": "kettlebell"
  },
  "Step-Up": {
    "description": "A lower-body exercise stepping onto a bench, building strength in the quads and glutes.",
    "instructions": [
      "Stand facing a sturdy box or bench.",
      "Place one foot fully on the box surface.",
      "Drive through that heel to lift your body onto the box.",
      "Bring your trailing foot up to stand fully on the box.",
      "Step back down leading with the same foot.",
      "Alternate legs or complete all reps on one side before switching."
    ],
    "tips": [
      "Push through the lead heel rather than springing off the back leg.",
      "Keep your torso upright and avoid leaning forward excessively.",
      "Control the descent instead of dropping off the box."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Quadriceps"
    ],
    "secondaryMuscles": [
      "Gastrocnemius",
      "Gluteus medius",
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": null
  },
  "Romanian Deadlift": {
    "description": "A hip-hinge movement emphasizing the hamstrings and glutes.",
    "instructions": [
      "Stand holding a barbell at hip level with an overhand grip.",
      "Hinge at the hips, pushing them back while keeping legs nearly straight.",
      "Lower the bar along your legs until you feel a hamstring stretch.",
      "Drive your hips forward to return to standing.",
      "Repeat."
    ],
    "tips": [
      "Keep your spine neutral and avoid rounding the lower back.",
      "Maintain the same slight knee bend for the entire rep.",
      "Go only as deep as your hamstring flexibility allows."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Erector spinae"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Stiff-Leg Deadlift": {
    "description": "A hip hinge with nearly straight legs, lowering the bar along the thighs to stretch and load the hamstrings.",
    "instructions": [
      "Stand with feet hip-width apart and hinge at the hips, legs nearly straight, holding a barbell low in front of your shins with a flat back.",
      "Keep your legs nearly straight with only a slight knee bend throughout.",
      "Drive the hips forward and stand upright, the bar travelling along your legs.",
      "Hinge at the hips again and lower the bar along your legs.",
      "Go as low as your hamstring flexibility allows with a flat back.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Push your hips back and keep the bar close to your legs.",
      "Go only as deep as a flat back allows.",
      "Feel the hamstrings load in the stretch, then drive the hips forward to stand."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Erector spinae",
      "Trapezius"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Lying Leg Curl": {
    "description": "An isolation exercise for the hamstrings using a leg curl machine.",
    "instructions": [
      "Lie face down on the leg curl machine with ankles under the pad.",
      "Curl your heels toward your glutes.",
      "Squeeze your hamstrings at the top.",
      "Lower with control.",
      "Repeat."
    ],
    "tips": [
      "Keep your hips pressed into the bench throughout the set.",
      "Avoid jerking the weight up with your lower back.",
      "Use a full range of motion without letting the stack slam down."
    ],
    "primaryMuscles": [
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Gastrocnemius"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "leg_curl"
  },
  "Seated Leg Curl": {
    "description": "A machine isolation exercise for the hamstrings performed in a seated position, providing consistent tension and reduced hip flexor involvement compared to the lying variant.",
    "instructions": [
      "Adjust the seat back and ankle pad so your knees align with the machine's pivot point.",
      "Sit upright, place the backs of your ankles on top of the pad, and grip the handles.",
      "Curl your lower legs down and back under the seat as far as the machine allows.",
      "Pause at peak contraction, then return the weight slowly to the starting position.",
      "Repeat for the desired reps."
    ],
    "tips": [
      "Keep your back firmly against the backrest throughout the movement.",
      "Point toes slightly toward your shins at peak contraction to increase hamstring activation.",
      "Control the eccentric phase — do not let the weight pull your legs back quickly."
    ],
    "primaryMuscles": [
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Gastrocnemius"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "leg_curl"
  },
  "Nordic Hamstring Curl": {
    "description": "A knee-flexion exercise lowering the torso forward from a kneeling position, working the hamstrings eccentrically.",
    "instructions": [
      "Kneel on a pad with your ankles anchored under a fixed support.",
      "Keep your torso upright and your hips extended.",
      "Slowly lower your body forward by resisting with your hamstrings.",
      "Catch yourself with your hands just before hitting the floor.",
      "Push back up and pull yourself to the starting position.",
      "Repeat for the desired number of reps."
    ],
    "tips": [
      "Lower as slowly as possible — the eccentric is the point.",
      "Keep your hips extended; do not fold at the waist.",
      "Catch yourself with your hands and push off lightly while building strength."
    ],
    "primaryMuscles": [
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Gastrocnemius",
      "Gluteus maximus"
    ],
    "difficulty": "advanced",
    "mechanic": "isolation",
    "equipment": "glute_ham_developer"
  },
  "Good Morning": {
    "description": "A hip-hinge movement with a barbell on the back for posterior chain development.",
    "instructions": [
      "Stand with a barbell across your upper back.",
      "Hinge at the hips, pushing them back while keeping your back flat.",
      "Lower your torso until it's nearly parallel to the floor.",
      "Drive your hips forward to return to standing.",
      "Repeat."
    ],
    "tips": [
      "Start with a light bar and master the hinge first.",
      "Keep a soft bend in your knees throughout.",
      "Stop the descent if your lower back starts to round."
    ],
    "primaryMuscles": [
      "Erector spinae",
      "Gluteus maximus",
      "Hamstrings"
    ],
    "secondaryMuscles": [],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Hip Thrust": {
    "description": "A compound glute exercise using a barbell across the hips.",
    "instructions": [
      "Sit on the floor with your upper back against a bench, barbell across your hips.",
      "Drive your hips up until your thighs are parallel to the floor.",
      "Squeeze your glutes at the top.",
      "Lower your hips back down with control.",
      "Repeat."
    ],
    "tips": [
      "Tuck your chin and keep your ribs down at the top.",
      "Finish with your shins vertical, driving through your heels.",
      "Reach full hip extension without arching your lower back."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Gluteus medius"
    ],
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Glute Bridge": {
    "description": "A bodyweight glute activation exercise performed lying on the floor.",
    "instructions": [
      "Lie on your back with knees bent and feet flat on the floor.",
      "Drive your hips up by squeezing your glutes.",
      "Hold briefly at the top with hips fully extended.",
      "Lower your hips back down with control.",
      "Repeat."
    ],
    "tips": [
      "Push through your heels rather than your toes.",
      "Avoid arching your lower back at the top.",
      "Don't let your knees cave inward as you lift."
    ],
    "primaryMuscles": [
      "Gluteus maximus"
    ],
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": null
  },
  "Cable Pull-Through": {
    "description": "A cable-resisted hip hinge performed facing away from a low pulley, loading the glutes and hamstrings without placing a bar across the spine.",
    "instructions": [
      "Attach a rope to the low pulley and stand facing away from the machine with the rope between the legs.",
      "Step forward until the cable is taut, then brace the trunk and soften the knees.",
      "Push the hips back while keeping the spine neutral and the arms long.",
      "Drive the hips forward and squeeze the glutes to stand tall.",
      "Reverse into the next hinge without letting the weight stack slam down."
    ],
    "tips": [
      "Think hips back and hips through; the arms only hold the rope.",
      "Keep the shins nearly vertical so the movement stays a hinge rather than a squat.",
      "Finish tall without leaning backwards at lockout."
    ],
    "primaryMuscles": [
      "Gluteus maximus",
      "Hamstrings"
    ],
    "secondaryMuscles": [
      "Erector spinae"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "cable"
  },
  "Cable Glute Kickback": {
    "description": "A cable isolation exercise for the glutes, extending the hip back against constant resistance.",
    "instructions": [
      "Attach an ankle cuff to a low cable pulley and fasten it around one ankle.",
      "Stand facing the machine, holding the frame lightly for balance, and hinge slightly forward at the hips.",
      "Kick the cuffed leg straight back, extending the hip fully while keeping the knee nearly straight.",
      "Squeeze the glute at full hip extension, then return the foot slowly to the start.",
      "Complete all reps on one side before switching."
    ],
    "tips": [
      "Lead with the heel to maximize glute activation over hamstrings.",
      "Keep the hips square; avoid rotating the pelvis as the leg kicks back.",
      "The movement comes entirely from the hip — keep the back and torso still."
    ],
    "primaryMuscles": [
      "Gluteus maximus"
    ],
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Barbell Curl": {
    "description": "A classic biceps isolation exercise using a barbell for maximal loading.",
    "instructions": [
      "Stand holding a barbell with a shoulder-width underhand grip.",
      "Curl the bar up toward your shoulders.",
      "Squeeze at the top, then lower under control.",
      "Repeat."
    ],
    "tips": [
      "Avoid swinging the torso.",
      "Keep elbows pinned at your sides."
    ],
    "primaryMuscles": [
      "Biceps brachii"
    ],
    "secondaryMuscles": [
      "Brachialis",
      "Forearm flexors"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "barbell"
  },
  "Dumbbell Curl": {
    "description": "An isolation exercise targeting the biceps.",
    "instructions": [
      "Stand holding dumbbells at your sides, palms forward.",
      "Curl the weights up toward your shoulders.",
      "Squeeze at the top, then lower under control.",
      "Repeat."
    ],
    "tips": [
      "Keep your elbows pinned to your sides.",
      "Avoid swinging the weights."
    ],
    "primaryMuscles": [
      "Biceps brachii"
    ],
    "secondaryMuscles": [
      "Brachialis",
      "Forearm flexors"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Hammer Curl": {
    "description": "A bicep curl variation with a neutral grip targeting the brachioradialis.",
    "instructions": [
      "Stand holding dumbbells at your sides with palms facing each other.",
      "Curl the weights up while keeping your palms facing inward.",
      "Squeeze at the top, then lower under control.",
      "Repeat."
    ],
    "tips": [
      "Keep your elbows pinned to your sides throughout.",
      "Keep your wrists straight and rigid throughout the curl.",
      "Avoid leaning back or swinging the weights up."
    ],
    "primaryMuscles": [
      "Biceps brachii",
      "Brachialis"
    ],
    "secondaryMuscles": [
      "Forearm flexors"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Preacher Curl": {
    "description": "A curl variation using a preacher bench to isolate the biceps.",
    "instructions": [
      "Sit at a preacher bench with your upper arms resting on the pad.",
      "Hold an EZ-bar with an underhand grip.",
      "Curl the bar up toward your shoulders.",
      "Lower with control until arms are nearly straight.",
      "Repeat."
    ],
    "tips": [
      "Avoid bouncing at the bottom to protect the biceps tendon.",
      "Keep your wrists neutral rather than letting them bend back.",
      "Don't shrug your shoulders as the bar rises."
    ],
    "primaryMuscles": [
      "Biceps brachii"
    ],
    "secondaryMuscles": [
      "Brachialis"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "ez_bar"
  },
  "Incline Dumbbell Curl": {
    "description": "A bicep curl on an incline bench for a deeper stretch of the long head.",
    "instructions": [
      "Sit on an incline bench set to 45 degrees, holding dumbbells at your sides.",
      "Let your arms hang straight down with palms forward.",
      "Curl the dumbbells up toward your shoulders.",
      "Lower with control to full extension.",
      "Repeat."
    ],
    "tips": [
      "Keep your head and shoulders against the bench throughout.",
      "Don't let your elbows drift forward as you curl.",
      "Avoid shrugging your shoulders forward as you lift the weight."
    ],
    "primaryMuscles": [
      "Biceps brachii"
    ],
    "secondaryMuscles": [
      "Brachialis"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Cable Curl": {
    "description": "A bicep curl using cable resistance for constant tension.",
    "instructions": [
      "Stand facing a low cable pulley with a straight bar or EZ-bar attachment.",
      "Grip the bar with an underhand grip, elbows at your sides.",
      "Curl the bar up toward your shoulders.",
      "Lower with control.",
      "Repeat."
    ],
    "tips": [
      "Keep your elbows from drifting forward as you curl.",
      "Straighten your arms fully at the bottom of each rep.",
      "Avoid leaning back to help lift the weight."
    ],
    "primaryMuscles": [
      "Biceps brachii"
    ],
    "secondaryMuscles": [
      "Brachialis"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Concentration Curl": {
    "description": "An isolation curl performed seated for peak bicep contraction.",
    "instructions": [
      "Sit on a bench with legs spread, holding a dumbbell in one hand.",
      "Brace your elbow against the inside of your thigh.",
      "Curl the dumbbell up toward your shoulder.",
      "Lower with control.",
      "Repeat on both sides."
    ],
    "tips": [
      "Keep your upper arm vertical and let only the forearm move.",
      "Avoid swinging your torso to help the weight up.",
      "Match the reps on each arm to avoid muscle imbalances."
    ],
    "primaryMuscles": [
      "Biceps brachii"
    ],
    "secondaryMuscles": [
      "Brachialis"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Triceps Pushdown": {
    "description": "An isolation exercise targeting the triceps using a cable machine.",
    "instructions": [
      "Stand facing a cable machine with a straight bar attachment.",
      "Grip the bar and pin your elbows to your sides.",
      "Push the bar down until your arms are fully extended.",
      "Slowly return to the starting position.",
      "Repeat."
    ],
    "tips": [
      "Keep your torso upright.",
      "Only your forearms should move."
    ],
    "primaryMuscles": [
      "Triceps brachii"
    ],
    "secondaryMuscles": [],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Overhead Triceps Extension": {
    "description": "An isolation exercise for the triceps emphasizing the long head.",
    "instructions": [
      "Stand or sit holding a dumbbell overhead with both hands.",
      "Lower the dumbbell behind your head by bending your elbows.",
      "Extend your arms back to the starting position.",
      "Keep your elbows close to your head throughout.",
      "Repeat."
    ],
    "tips": [
      "Keep your ribs down and avoid arching your lower back.",
      "Lower until you feel a deep stretch in your triceps.",
      "Check your grip is secure before lowering the dumbbell behind your head."
    ],
    "primaryMuscles": [
      "Triceps brachii"
    ],
    "secondaryMuscles": [],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "dumbbell"
  },
  "Skull Crusher": {
    "description": "A lying triceps extension using a barbell to isolate the triceps through a full range of motion.",
    "instructions": [
      "Lie on a flat bench holding a barbell over your chest with a narrow grip.",
      "Lower the bar toward your forehead by bending at the elbows.",
      "Extend your arms back to the start.",
      "Repeat."
    ],
    "tips": [
      "Keep upper arms vertical throughout.",
      "Lower slowly to protect the elbows."
    ],
    "primaryMuscles": [
      "Triceps brachii"
    ],
    "secondaryMuscles": [],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "barbell"
  },
  "Close-Grip Bench Press": {
    "description": "A bench press variation with a narrow grip that shifts the emphasis to the triceps.",
    "instructions": [
      "Lie on a flat bench and grip the barbell with hands shoulder-width apart.",
      "Lower the bar to your lower chest keeping elbows close to your sides.",
      "Press back up to full extension.",
      "Repeat."
    ],
    "tips": [
      "Keep elbows tucked to maximize triceps activation.",
      "Avoid too-narrow a grip to prevent wrist strain."
    ],
    "primaryMuscles": [
      "Triceps brachii"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Pectoralis major"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "barbell"
  },
  "Cable Triceps Kickback": {
    "description": "An isolation movement performed hinged forward, extending the elbow against cable resistance to work the triceps.",
    "instructions": [
      "Attach a handle to a low cable and hinge forward at the hips.",
      "Tuck your upper arm against your side with elbow bent 90 degrees.",
      "Extend your elbow to push the handle back behind you.",
      "Squeeze your triceps at the end of the movement.",
      "Return under control. Complete reps on one side, then switch."
    ],
    "tips": [
      "Move only your forearm; keep the upper arm completely still.",
      "Avoid rounding your back while holding the hinged position.",
      "Use a light weight to reach full lockout without swinging."
    ],
    "primaryMuscles": [
      "Triceps brachii"
    ],
    "secondaryMuscles": [
      "Posterior deltoid"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Plank": {
    "description": "An isometric core exercise that strengthens the entire midsection.",
    "instructions": [
      "Place your forearms on the floor with elbows under your shoulders.",
      "Extend your legs back and rise onto your toes.",
      "Keep your body in a straight line from head to heels.",
      "Brace your core and squeeze your glutes.",
      "Hold the position for the desired duration.",
      "Lower your knees to exit the hold."
    ],
    "tips": [
      "Do not let your hips sag or pike up.",
      "Squeeze your glutes and quads."
    ],
    "primaryMuscles": [
      "Rectus abdominis",
      "Transverse abdominis"
    ],
    "secondaryMuscles": [
      "Erector spinae"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": null
  },
  "Hanging Leg Raise": {
    "description": "An advanced core exercise performed hanging from a bar.",
    "instructions": [
      "Hang from a pull-up bar with an overhand grip.",
      "Raise your legs in front of you until they are parallel to the floor.",
      "Hold briefly, then lower with control.",
      "Avoid swinging.",
      "Repeat."
    ],
    "tips": [
      "Curl your pelvis up at the top to fully engage your abs.",
      "Keep your shoulders engaged rather than hanging passively.",
      "Bend your knees to make the movement easier if needed."
    ],
    "primaryMuscles": [
      "Hip flexors",
      "Rectus abdominis"
    ],
    "secondaryMuscles": [
      "Obliques"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "pull_up_bar"
  },
  "Cable Crunch": {
    "description": "A kneeling abdominal exercise flexing the spine against cable resistance, allowing progressive loading of the rectus abdominis.",
    "instructions": [
      "Kneel in front of a cable machine with a rope attachment at the top.",
      "Hold the rope near your forehead with elbows bent.",
      "Crunch down by flexing your spine and bringing your elbows to your thighs.",
      "Squeeze your abs hard at the bottom.",
      "Return to the start position and repeat."
    ],
    "tips": [
      "Avoid pulling the rope down with your arms.",
      "Keep your hips fixed so movement comes from the spine.",
      "Exhale fully as you crunch down."
    ],
    "primaryMuscles": [
      "Rectus abdominis"
    ],
    "secondaryMuscles": [
      "Obliques",
      "Transverse abdominis"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": "cable"
  },
  "Sit-Up": {
    "description": "A classic abdominal exercise with a full range of motion.",
    "instructions": [
      "Lie on your back with knees bent and feet anchored.",
      "Cross your arms over your chest or place hands behind your head.",
      "Sit all the way up until your torso is upright.",
      "Lower back down with control.",
      "Repeat."
    ],
    "tips": [
      "Avoid pulling on your neck when your hands are behind your head.",
      "Roll up through the spine rather than jerking with momentum.",
      "Exhale on the way up to reinforce the abdominal contraction."
    ],
    "primaryMuscles": [
      "Hip flexors",
      "Rectus abdominis"
    ],
    "secondaryMuscles": [
      "Obliques"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": null
  },
  "Russian Twist": {
    "description": "A rotational core exercise targeting the obliques.",
    "instructions": [
      "Sit on the floor with knees bent, lean back slightly.",
      "Hold your hands together or hold a weight at chest level.",
      "Rotate your torso to one side, then the other.",
      "Keep your core braced throughout.",
      "Repeat."
    ],
    "tips": [
      "Rotate from the torso rather than just swinging the arms.",
      "Keep your chest lifted and your spine long as you twist.",
      "Move at a controlled tempo instead of racing through reps."
    ],
    "primaryMuscles": [
      "Obliques",
      "Rectus abdominis"
    ],
    "secondaryMuscles": [
      "Hip flexors"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": null
  },
  "Ab Wheel Rollout": {
    "description": "A core exercise rolling a wheel forward and back, training anti-extension of the spine.",
    "instructions": [
      "Kneel on the floor and grip the ab wheel handles shoulder-width.",
      "Brace the core hard so the lower back stays neutral.",
      "Roll the wheel slowly forward, extending the body as far as you can control.",
      "Stop before the hips sag or the back arches.",
      "Pull the wheel back to the knees by contracting the abs."
    ],
    "tips": [
      "Brace the core before each rep — do not let the lower back arch.",
      "Build range gradually, stopping short of any hip sag.",
      "Drop to a wall stop if you cannot control the bottom."
    ],
    "primaryMuscles": [
      "Rectus abdominis",
      "Transverse abdominis"
    ],
    "secondaryMuscles": [
      "Anterior deltoid",
      "Latissimus dorsi",
      "Obliques",
      "Serratus anterior"
    ],
    "difficulty": "intermediate",
    "mechanic": "compound",
    "equipment": "ab_wheel"
  },
  "Bicycle Crunch": {
    "description": "A dynamic crunch variation targeting both the rectus abdominis and obliques.",
    "instructions": [
      "Lie on your back with hands behind your head and legs raised.",
      "Bring one knee toward your chest while rotating your torso to meet it with the opposite elbow.",
      "Extend that leg while bringing the other knee in.",
      "Continue alternating in a pedaling motion.",
      "Repeat."
    ],
    "tips": [
      "Avoid pulling on your neck with your hands.",
      "Lead the rotation with your shoulder, not your elbow.",
      "Move slowly and deliberately rather than racing through reps."
    ],
    "primaryMuscles": [
      "Obliques",
      "Rectus abdominis"
    ],
    "secondaryMuscles": [
      "Hip flexors"
    ],
    "difficulty": "beginner",
    "mechanic": "compound",
    "equipment": null
  },
  "Standing Calf Raise": {
    "description": "A calf raise performed standing to develop the gastrocnemius through a full range of motion.",
    "instructions": [
      "Stand on the edge of a platform or calf raise machine.",
      "Lower heels below the platform.",
      "Push up onto your toes.",
      "Lower slowly.",
      "Repeat."
    ],
    "tips": [
      "Pause at the top to maximize contraction.",
      "Full heel drop increases range of motion."
    ],
    "primaryMuscles": [
      "Gastrocnemius"
    ],
    "secondaryMuscles": [
      "Soleus"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "standing_calf_raise_machine"
  },
  "Seated Calf Raise": {
    "description": "A machine calf raise performed seated to specifically target the soleus muscle.",
    "instructions": [
      "Sit at a calf raise machine with the pads resting on your thighs.",
      "Lower your heels as far as possible.",
      "Raise up onto your toes.",
      "Lower under control.",
      "Repeat."
    ],
    "tips": [
      "The bent knee slackens the gastrocnemius, so the soleus does more of the work.",
      "Use a full range of motion."
    ],
    "primaryMuscles": [
      "Soleus"
    ],
    "secondaryMuscles": [
      "Gastrocnemius"
    ],
    "difficulty": "beginner",
    "mechanic": "isolation",
    "equipment": "seated_calf_raise_machine"
  },
  "Donkey Calf Raise": {
    "description": "A bent-over calf raise that maximizes calf stretch by hinging at the hips.",
    "instructions": [
      "Bend at the hips and place your hands on the floor in front of you, hips high and legs nearly straight.",
      "Set your feet hip-width apart with your weight on the balls of the feet.",
      "Lower your heels as far as they go (below the edge if you stand on a raised platform) for a full stretch.",
      "Drive up onto the toes as high as possible, squeezing the calves.",
      "Lower under control to a deep stretch."
    ],
    "tips": [
      "Pause briefly at the top to maximize the contraction.",
      "Use a slow eccentric for full stretch.",
      "Add a partner or weight on the lower back for resistance."
    ],
    "primaryMuscles": [
      "Gastrocnemius"
    ],
    "secondaryMuscles": [
      "Soleus"
    ],
    "difficulty": "intermediate",
    "mechanic": "isolation",
    "equipment": null
  },
};

/** The guide for an exercise, or null when we ship no vetted guidance for it. */
export function guideForExerciseName(name: string): ExerciseGuide | null {
  return GUIDES[name] ?? null;
}
