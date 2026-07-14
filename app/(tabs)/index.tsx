import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Pressable,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

/* ===========================================================
   GAME CONSTANTS
=========================================================== */

const ROCKET_WIDTH = 70;
const ROCKET_HEIGHT = 85;
const MOVE_SPEED = 8;

const INITIAL_ASTEROIDS = 3;
const MAX_ASTEROIDS = 7;

const SMALL_SIZE = [35, 45];
const MEDIUM_SIZE = [46, 60];
const LARGE_SIZE = [61, 78];

const SHIELD_SIZE = 75;
const SHIELD_UNLOCK_SCORE = 20;
const SHIELD_DURATION = 8;
const SHIELD_MAX_DURATION = 16;
const SHIELD_DROP_TIME = 15000;

const EXPLOSION_SIZE = 160;

const FPS = 16;

/* ===========================================================
   TYPES
=========================================================== */

type AsteroidSize = "small" | "medium" | "large";

interface Asteroid {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  type: AsteroidSize;
}

interface Shield {
  x: number;
  y: number;
  speed: number;
}

let asteroidId = 0;

/* ===========================================================
   HOME SCREEN
=========================================================== */

export default function HomeScreen() {

    const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const [rocketX, setRocketX] = useState(
    (width - ROCKET_WIDTH) / 2
  );

  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);

  const [shield, setShield] = useState<Shield | null>(null);

  const [shieldActive, setShieldActive] = useState(false);

  const [shieldTime, setShieldTime] = useState(0);

  const [shieldBlink, setShieldBlink] = useState(false);

  const [exploding, setExploding] = useState(false);

  const [explosionScale, setExplosionScale] = useState(1);

    const moveDirection = useRef<"left" | "right" | null>(null);

  const scoreRef = useRef(0);

  const gameOverRef = useRef(false);

  const shieldSpawnRef = useRef(Date.now());

  const collisionLock = useRef(false);

    useEffect(() => {
    scoreRef.current = score;
  }, [score]);

    const asteroidSpeed = () => {
    if (scoreRef.current < 10)
      return 4 + Math.random() * 2;

    if (scoreRef.current < 25)
      return 5 + Math.random() * 2;

    if (scoreRef.current < 50)
      return 6 + Math.random() * 2;

    if (scoreRef.current < 80)
      return 7 + Math.random() * 3;

    return 9 + Math.random() * 3;
  };

    function createAsteroid(startY = -120): Asteroid {
    const r = Math.random();

    let size: number;
    let type: AsteroidSize;

    if (r < 0.45) {
      type = "small";
      size =
        SMALL_SIZE[0] +
        Math.random() * (SMALL_SIZE[1] - SMALL_SIZE[0]);
    } else if (r < 0.8) {
      type = "medium";
      size =
        MEDIUM_SIZE[0] +
        Math.random() * (MEDIUM_SIZE[1] - MEDIUM_SIZE[0]);
    } else {
      type = "large";
      size =
        LARGE_SIZE[0] +
        Math.random() * (LARGE_SIZE[1] - LARGE_SIZE[0]);
    }

    return {
      id: asteroidId++,
      x: Math.random() * (width - size),
      y: startY,
      size,
      speed: asteroidSpeed(),
      type,
    };
  }

 function createShield(): Shield {
  let speed = 2 + Math.random();

  if (scoreRef.current >= 60) {
    speed = 4 + Math.random();
  }

  return {
    x: Math.random() * (width - SHIELD_SIZE),
    y: -SHIELD_SIZE,
    speed,
  };
}
  /* ===========================================================
   START GAME
=========================================================== */

const startGame = () => {
  if (gameStarted) return;

  asteroidId = 0;

  setAsteroids([
    createAsteroid(-100),
    createAsteroid(-350),
    createAsteroid(-650),
  ]);

  setShield(null);
  setShieldActive(false);
  setShieldTime(0);
  setShieldBlink(false);

  collisionLock.current = false;
  gameOverRef.current = false;
  shieldSpawnRef.current = Date.now();

  setGameStarted(true);
};

/* ===========================================================
   RESTART
=========================================================== */

const restartGame = () => {
  asteroidId = 0;

  moveDirection.current = null;

  collisionLock.current = false;
  gameOverRef.current = false;

  scoreRef.current = 0;

  setScore(0);

  setRocketX((width - ROCKET_WIDTH) / 2);

  setAsteroids([]);

  setShield(null);

  setShieldActive(false);

  setShieldTime(0);

  setShieldBlink(false);

  setExploding(false);

  setExplosionScale(1);

  setGameOver(false);

  setGameStarted(false);

  shieldSpawnRef.current = Date.now();
};

/* ===========================================================
   SHIELD
=========================================================== */

const activateShield = () => {
  setShield(null);

  setShieldActive(true);

  setShieldTime((prev) => {
    if (prev === 0) return SHIELD_DURATION;

    return Math.min(prev + SHIELD_DURATION, SHIELD_MAX_DURATION);
  });
};

/* ===========================================================
   CONTROLS
=========================================================== */

const startMovingLeft = () => {
  if (gameOverRef.current) return;

  if (!gameStarted) startGame();

  moveDirection.current = "left";
};

const startMovingRight = () => {
  if (gameOverRef.current) return;

  if (!gameStarted) startGame();

  moveDirection.current = "right";
};

const stopMoving = () => {
  moveDirection.current = null;
};

/* ===========================================================
   ROCKET MOVEMENT
=========================================================== */

useEffect(() => {
  const movement = setInterval(() => {
    if (!gameStarted) return;

    if (gameOverRef.current) return;

    if (moveDirection.current === "left") {
      setRocketX((prev) => Math.max(prev - MOVE_SPEED, -20));
    }

    if (moveDirection.current === "right") {
      setRocketX((prev) =>
        Math.min(prev + MOVE_SPEED, width - ROCKET_WIDTH + 20)
      );
    }
  }, FPS);

  return () => clearInterval(movement);
}, [gameStarted]);

/* ===========================================================
   BEST SCORE
=========================================================== */

useEffect(() => {
  if (score > bestScore) {
    setBestScore(score);
  }
}, [score, bestScore]);

/* ===========================================================
   ASTEROID ENGINE
=========================================================== */

useEffect(() => {
  if (!gameStarted) return;

  const asteroidLoop = setInterval(() => {
    if (gameOverRef.current) return;

    setAsteroids((previous) => {
      let updated = previous.map((asteroid) => {
        const newY = asteroid.y + asteroid.speed;

        if (newY > height + asteroid.size) {
          const nextScore = scoreRef.current + 1;

          scoreRef.current = nextScore;

          setScore(nextScore);

          return createAsteroid(-100 - Math.random() * 500);
        }

        return {
          ...asteroid,
          y: newY,
        };
      });

      let required = INITIAL_ASTEROIDS;

      if (scoreRef.current >= 30) required = 4;

      if (scoreRef.current >= 60) required = 5;

      if (scoreRef.current >= 90) required = 6;

      if (scoreRef.current >= 130) required = MAX_ASTEROIDS;

      while (updated.length < required) {
        updated.push(
          createAsteroid(-200 - Math.random() * 700)
        );
      }

      return updated;
    });
  }, FPS);

  return () => clearInterval(asteroidLoop);
}, [gameStarted]);

/* ===========================================================
   SHIELD SPAWNER
=========================================================== */
useEffect(() => {
  if (!gameStarted) return;

  const shieldSpawner = setInterval(() => {
    if (gameOverRef.current) return;

    if (scoreRef.current < SHIELD_UNLOCK_SCORE) return;

    let spawnTime = SHIELD_DROP_TIME;

    if (scoreRef.current >= 60) {
      spawnTime = 8000; // every 8 seconds
    }

    if (
      shield === null &&
      Date.now() - shieldSpawnRef.current > spawnTime
    ) {
      setShield(createShield());
      shieldSpawnRef.current = Date.now();
    }
  }, 500);

  return () => clearInterval(shieldSpawner);
}, [gameStarted, shield]);

/* ===========================================================
   SHIELD MOVEMENT
=========================================================== */

useEffect(() => {
  const movement = setInterval(() => {
    setShield((previous) => {
      if (!previous) return null;

      const newY = previous.y + previous.speed;

      if (newY > height) return null;

      return {
        ...previous,
        y: newY,
      };
    });
  }, 30);

  return () => clearInterval(movement);
}, []);

/* ===========================================================
   COLLISION
=========================================================== */

const isColliding = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) => {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
};

/* ===========================================================
   SHIELD TIMER
=========================================================== */

useEffect(() => {
  if (!shieldActive) return;

  const timer = setInterval(() => {
    setShieldTime((prev) => {
      if (prev <= 1) {
        setShieldActive(false);
        setShieldBlink(false);
        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [shieldActive]);

/* ===========================================================
   SHIELD BLINK
=========================================================== */

useEffect(() => {
  if (
    shieldActive &&
    shieldTime > 0 &&
    shieldTime <= 3
  ) {
    const blink = setInterval(() => {
      setShieldBlink((prev) => !prev);
    }, 250);

    return () => clearInterval(blink);
  }

  setShieldBlink(false);
}, [shieldActive, shieldTime]);

/* ===========================================================
   EXPLOSION
=========================================================== */

const triggerExplosion = () => {
  setExploding(true);

  setExplosionScale(0.6);

  const grow = setInterval(() => {
    setExplosionScale((prev) => {
      if (prev >= 1.35) {
        clearInterval(grow);
        return 1.35;
      }

      return prev + 0.12;
    });
  }, 40);

  setTimeout(() => {
    setGameOver(true);
    gameOverRef.current = true;
  }, 700);
};

/* ===========================================================
   COLLISION ENGINE
=========================================================== */

useEffect(() => {
  if (!gameStarted) return;

  const collisionLoop = setInterval(() => {
    if (gameOverRef.current) return;

    const rocketY = height - 160;

    /* ---------- Shield Pickup ---------- */

    if (shield) {
  const shieldPickupWidth = ROCKET_WIDTH + 25;
  const shieldPickupHeight = ROCKET_HEIGHT + 25;

  const pickupX =
    rocketX - (shieldPickupWidth - ROCKET_WIDTH) / 2;

  const pickupY =
    rocketY - (shieldPickupHeight - ROCKET_HEIGHT) / 2;

  if (
    isColliding(
      pickupX,
      pickupY,
      shieldPickupWidth,
      shieldPickupHeight,
      shield.x,
      shield.y,
      SHIELD_SIZE,
      SHIELD_SIZE
    )
  ) {
    activateShield();
  }
}
    /* ---------- Asteroids ---------- */

    for (const asteroid of asteroids) {
      const ROCKET_HITBOX_WIDTH = 40;
const ROCKET_HITBOX_HEIGHT = 55;

const rocketHitboxX =
  rocketX + (ROCKET_WIDTH - ROCKET_HITBOX_WIDTH) / 2;

const rocketHitboxY =
  rocketY + (ROCKET_HEIGHT - ROCKET_HITBOX_HEIGHT) / 2;

const hit = isColliding(
  rocketHitboxX,
  rocketHitboxY,
  ROCKET_HITBOX_WIDTH,
  ROCKET_HITBOX_HEIGHT,
  asteroid.x,
  asteroid.y,
  asteroid.size,
  asteroid.size
);

      if (!hit) continue;

      if (collisionLock.current) return;

      collisionLock.current = true;

      if (shieldActive) {
        setShieldActive(false);
        setShieldTime(0);
        setShieldBlink(false);

        setAsteroids((prev) =>
          prev.map((a) =>
            a.id === asteroid.id
              ? createAsteroid(
                  -100 - Math.random() * 500
                )
              : a
          )
        );

        setTimeout(() => {
          collisionLock.current = false;
        }, 250);

        return;
      }

      triggerExplosion();
      return;
    }
  }, FPS);

  return () => clearInterval(collisionLoop);
}, [
  asteroids,
  rocketX,
  shield,
  shieldActive,
  gameStarted,
]);

/* ===========================================================
   SHIELD BAR
=========================================================== */

const shieldPercentage =
  (shieldTime / SHIELD_MAX_DURATION) * 100;

  /* ===========================================================
   STOP MOVEMENT AFTER GAME OVER
=========================================================== */

useEffect(() => {
  if (!gameOver) return;

  moveDirection.current = null;
}, [gameOver]);

/* ===========================================================
   RENDER
=========================================================== */

return (
  <View style={styles.container}>
    <ImageBackground
      source={require("../../assets/images/space-bg.jpg")}
      style={styles.background}
      resizeMode="cover"
    >

      {/* ---------------- SCORE ---------------- */}

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>
          Score : {score}
        </Text>

        <Text style={styles.bestText}>
          Best : {bestScore}
        </Text>
      </View>

      {/* ---------------- SHIELD BAR ---------------- */}

      {shieldActive && shieldTime > 0 && (
        <View style={styles.shieldContainer}>
          <View
            style={[
              styles.shieldBar,
              shieldBlink && styles.blink,
            ]}
          >
            <View
              style={[
                styles.shieldFill,
                {
                  width: `${shieldPercentage}%`,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.shieldTimer,
              shieldBlink && styles.blink,
            ]}
          >
            Shield : {shieldTime}s
          </Text>
        </View>
      )}

      {/* ---------------- START SCREEN ---------------- */}

      {!gameStarted && !gameOver && (
        <View style={styles.startContainer}>
          <Text style={styles.title}>
            SPACE DODGER
          </Text>

          <Pressable
            style={styles.startButton}
            onPress={startGame}
          >
            <Text style={styles.startText}>
              START GAME
            </Text>
          </Pressable>
        </View>
      )}

      {/* ---------------- GAME OBJECTS ---------------- */}

      {gameStarted && (
        <>
          {/* Asteroids */}

          {asteroids.map((asteroid) => (
            <Image
              key={asteroid.id}
              source={require("../../assets/images/asteroid.png")}
              style={[
                styles.asteroid,
                {
                  left: asteroid.x,
                  top: asteroid.y,
                  width: asteroid.size,
                  height: asteroid.size,
                },
              ]}
            />
          ))}

          {/* Shield */}

          {shield && (
            <Image
              source={require("../../assets/images/shield.png")}
              style={[
                styles.shield,
                {
                  left: shield.x,
                  top: shield.y,
                },
              ]}
            />
          )}

          {/* Rocket */}

          {!exploding && (
            <Image
              source={require("../../assets/images/rocket.png")}
              style={[
                styles.rocket,
                {
                  left: rocketX,
                },
              ]}
            />
          )}

          {/* Explosion */}

          {exploding && (
            <Image
              source={require("../../assets/images/explosion.png")}
              style={[
                styles.explosion,
                {
                  left:
                    rocketX +
                    ROCKET_WIDTH / 2 -
                    (EXPLOSION_SIZE *
                      explosionScale) /
                      2,

                  transform: [
                    {
                      scale: explosionScale,
                    },
                  ],
                },
              ]}
            />
          )}
        </>
      )}

      {/* ---------------- GAME OVER ---------------- */}

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOver}>
            GAME OVER
          </Text>

          <Text style={styles.finalScore}>
            Final Score : {score}
          </Text>

          <Pressable
            style={styles.restartButton}
            onPress={restartGame}
          >
            <Text style={styles.restartText}>
              PLAY AGAIN
            </Text>
          </Pressable>
        </View>
      )}
    </ImageBackground>

    {/* ---------------- CONTROLS ---------------- */}

    {gameStarted && !gameOver && (
      <View style={styles.controls}>
        <Pressable
          style={styles.control}
          onPressIn={startMovingLeft}
          onPressOut={stopMoving}
        >
          <Text style={styles.controlText}>
            ◀
          </Text>
        </Pressable>

        <Pressable
          style={styles.control}
          onPressIn={startMovingRight}
          onPressOut={stopMoving}
        >
          <Text style={styles.controlText}>
            ▶
          </Text>
        </Pressable>
      </View>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  /* ===========================================================
     MAIN
  =========================================================== */

  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  background: {
    flex: 1,
  },

  /* ===========================================================
     SCORE
  =========================================================== */

  scoreContainer: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scoreText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  bestText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
  },

  /* ===========================================================
     START SCREEN
  =========================================================== */

  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    marginBottom: 40,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 8,
  },

  startButton: {
    width: 220,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#6A00FF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  startText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 22,
  },

  /* ===========================================================
     SHIELD
  =========================================================== */

  shieldContainer: {
    position: "absolute",
    top: 95,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 120,
  },

  shieldBar: {
    width: 180,
    height: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  shieldFill: {
    height: "100%",
    backgroundColor: "#00BFFF",
    borderRadius: 10,
  },

  shieldTimer: {
    marginTop: 6,
    color: "#00BFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  blink: {
    opacity: 0.2,
  },

  /* ===========================================================
     OBJECTS
  =========================================================== */

  asteroid: {
    position: "absolute",
    resizeMode: "contain",
  },

  shield: {
    position: "absolute",
    width: SHIELD_SIZE,
    height: SHIELD_SIZE,
    resizeMode: "contain",
  },

  rocket: {
    position: "absolute",
    bottom: 75,
    width: ROCKET_WIDTH,
    height: ROCKET_HEIGHT,
    resizeMode: "contain",
  },

  explosion: {
    position: "absolute",
    bottom: 45,
    width: EXPLOSION_SIZE,
    height: EXPLOSION_SIZE,
    resizeMode: "contain",
  },

  /* ===========================================================
     GAME OVER
  =========================================================== */

  gameOverContainer: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 300,
  },

  gameOver: {
    color: "#FF3B30",
    fontSize: 42,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 6,
  },

  finalScore: {
    marginTop: 15,
    marginBottom: 25,
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
  },

  restartButton: {
    width: 190,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  restartText: {
    color: "#6A00FF",
    fontSize: 22,
    fontWeight: "900",
  },

  /* ===========================================================
     CONTROLS
  =========================================================== */

  controls: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  control: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  controlText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "bold",
  },
});