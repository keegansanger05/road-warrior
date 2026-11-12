import { Scene } from 'phaser';
import { addCurrency, loadProgress } from '../utils/progress';

const RESPAWN_DELAY = 2000;
const RESPAWN_INVULN = 2000;
const ROCKET_DAMAGE = 60;

export class BaseRace extends Scene {

    

    // ====================================================================
    // SCENE LIFECYCLE
    // ====================================================================

    init(data) {
        this.selectedWeaponIndex = (data && typeof data.weaponIndex === 'number') ? data.weaponIndex : 0;
        this.selectedCarIndex = (data && typeof data.carIndex === 'number') ? data.carIndex : 0;
    }

    // ====================================================================
    // SETUP: PLAYER, AI, GROUND, CAMERA, INPUT
    // ====================================================================

    getPlayerTextureKey() {
        const carTextures = ['black3', 'predator', 'sand_rat'];
        return carTextures[this.selectedCarIndex] || 'black3';
    }

    setupPlayer(startX = 80, startY = 600) {
        this.player = this.physics.add.sprite(startX, startY, this.getPlayerTextureKey());
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);
        this.player.setDamping(true);
        this.player.setDrag(0.85);
        this.player.setMaxVelocity(500);
        this.player.setBounce(0.1);
        this.player.isStunned = false;
        this.player.health = 25;
        this.player.maxHealth = 25;
        this.raceFinished = false;

        // Snap to actual ground height now that scale (and displayHeight) is known
        this.player.y = 730 - this.player.displayHeight / 2;

        // Flip/boost state
        this.player.flipBoostUntil = 0;
        this.player.wasAirborne = false;
        this.player.totalFlipRotation = 0;
    }

    setupGround(trackWidth) {
        const groundRect = this.add.rectangle(trackWidth / 2, 750, trackWidth, 40, 0x000000, 0);
        this.physics.add.existing(groundRect, true);
        this.ground = groundRect;
        this.physics.add.collider(this.player, this.ground);
    }

    setupAIRacers(count = 3, trackWidth, startX = 280) {
        this.aiRacers = [];
        const aiTextures = ['ai_1', 'ai_2', 'ai_3'];
        const aiNames = ['Zack Vandal', 'Axel Raze', 'Kane Dustborn'];

        for (let i = 0; i < count; i++) {
            const texture = aiTextures[i % aiTextures.length];

            const ai = this.physics.add.sprite(startX + (i * 140), 600, texture);
            ai.setScale(0.15);
            ai.aiName = aiNames[i % aiNames.length];

            // Snap to actual ground height now that scale (and displayHeight) is known
            ai.y = 730 - ai.displayHeight / 2;

            ai.body.setCollideWorldBounds(true);
            ai.body.setDamping(true);
            ai.body.setDrag(0.85);

            ai.baseMaxVelocity = 350 + Math.random() * 80;
            ai.body.setMaxVelocity(ai.baseMaxVelocity);
            ai.body.setBounce(0.1);

            ai.aiSpeed = 250 + Math.random() * 80;
            ai.isStunned = false;
            ai.hasFinished = false;
            ai.isDefeated = false;
            ai.health = 25;
            ai.maxHealth = 25;

            ai.fireRange = 180;
            ai.fireCooldown = 2500 + Math.random() * 1500;
            ai.lastFiredTime = 0;

            // Flip/boost state
            ai.flipBoostUntil = 0;
            ai.wasAirborne = false;
            ai.totalFlipRotation = 0;
            ai.flipLimit = 0;
            ai.flipDir = 1;
            ai.flipSpeed = 0.08;

            if (this.ground) {
                this.physics.add.collider(ai, this.ground);
            }
            //this.physics.add.collider(ai, this.player);//

            this.aiRacers.push(ai);
        }
    }

    setupCameraAndWorld(trackWidth, trackHeight = 768) {
        this.physics.world.setBounds(0, 0, trackWidth, trackHeight);
        this.cameras.main.setBounds(0, 0, trackWidth, trackHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE,R');
        this.pauseKeys = this.input.keyboard.addKeys('ESC,P');
        this.prevRDown = false;
        this.prevPauseDown = false;
        this.justResumed = false;
        this.setupWeapons();
    }

    

    // ====================================================================
    // COUNTDOWN
    // ====================================================================

    startCountdown() {
        this.raceStarted = false;

        this.player.body.setAllowGravity(false);
        if (this.aiRacers) {
            this.aiRacers.forEach(ai => ai.body.setAllowGravity(false));
        }

        const { width, height } = this.cameras.main;
        const countdownText = this.add.text(width / 2, height / 2, '', {
            fontFamily: 'Arial Black', fontSize: 120, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        const sequence = ['3', '2', '1', 'GO!'];
        let index = 0;

        const showNext = () => {
            if (index >= sequence.length) {
                countdownText.destroy();

                this.player.body.setAllowGravity(true);
                if (this.aiRacers) {
                    this.aiRacers.forEach(ai => ai.body.setAllowGravity(true));
                }

                this.raceStarted = true;
                this.weaponsEnabledAt = this.time.now + 2500; // controls when weapon enabled
                return;
            }

            countdownText.setText(sequence[index]);
            countdownText.setScale(1.4);
            countdownText.setAlpha(1);
            countdownText.setColor(sequence[index] === 'GO!' ? '#2ecc71' : '#ffffff');

            this.tweens.add({
                targets: countdownText,
                scale: 1,
                duration: 300,
                ease: 'Cubic.Out'
            });

            if (sequence[index] === 'GO!') {
                this.tweens.add({
                    targets: countdownText,
                    alpha: 0,
                    delay: 500,
                    duration: 400
                });
            }

            index++;
            this.time.delayedCall(1000, showNext);
        };

        showNext();
    }

    // ====================================================================
    // WEAPONS
    // ====================================================================

    setupWeapons() {
        this.weaponConfigs = [
            { name: 'Blaster', fireRate: 250, speed: 500, damage: 10, color: 0xffcc00, radius: 5, type: 'straight', maxAmmo: 30 },
            { name: 'Homing Missile', fireRate: 900, speed: 350, damage: 25, color: 0xe74c3c, radius: 7, type: 'homing', maxAmmo: 6 },
            { name: 'Oil Slick', fireRate: 1500, speed: 0, damage: 0, color: 0x2c2c2c, radius: 10, type: 'utility', maxAmmo: 5 }
        ];

        this.currentWeaponIndex = this.selectedWeaponIndex;
        this.lastFiredTime = 0;
        this.projectiles = this.physics.add.group();
        this.aiProjectiles = this.physics.add.group();

        this.weaponAmmo = this.weaponConfigs.map(w => w.maxAmmo);
        this.rocketCharges = 0;

        this.weaponsEnabledAt = this.time.now + 5000;

        this.weaponText = this.add.text(20, 20, '', {
            fontFamily: 'Arial Black', fontSize: 16, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0);

        this.updateWeaponHUD();
        this.createPlayerHealthBar();
        this.createCurrencyHUD();
    }

    updateWeaponHUD() {
        const weapon = this.weaponConfigs[this.currentWeaponIndex];
        const remaining = Math.max(0, Math.ceil((this.weaponsEnabledAt - this.time.now) / 1000));
        const ammo = this.weaponAmmo ? this.weaponAmmo[this.currentWeaponIndex] : 0;
        const rockets = this.rocketCharges || 0;

        let text = `WEAPON: ${weapon.name} (${ammo} ammo)`;
        if (remaining > 0) text += ` - unlocks in ${remaining}s`;
        text += ` | ROCKETS: ${rockets} (R)`;

        this.weaponText.setText(text);
    }

    fireWeapon() {
        const time = this.time.now;
        if (time < this.weaponsEnabledAt) return;

        const weapon = this.weaponConfigs[this.currentWeaponIndex];

        if (time < this.lastFiredTime + weapon.fireRate) return;
        if (this.weaponAmmo[this.currentWeaponIndex] <= 0) return;

        this.lastFiredTime = time;
        this.weaponAmmo[this.currentWeaponIndex] -= 1;
        this.updateWeaponHUD();

        const facing = this.player.flipX ? -1 : 1;
        const spawnX = this.player.x + (facing * 30);
        const spawnY = this.player.y;

        const projectile = this.add.circle(spawnX, spawnY, weapon.radius, weapon.color);
        this.physics.add.existing(projectile);
        this.projectiles.add(projectile);

        projectile.weaponType = weapon.type;
        projectile.damage = weapon.damage;

        if (weapon.type === 'straight') {
            projectile.body.setVelocityX(weapon.speed * facing);
        } else if (weapon.type === 'homing') {
            projectile.body.setVelocityX(weapon.speed * facing);
            projectile.isHoming = true;
        } else if (weapon.type === 'utility') {
            projectile.x = this.player.x - (facing * 40);
            projectile.body.setVelocity(0, 0);
            projectile.isHazard = true;
        }

        this.time.delayedCall(3000, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    aiFireWeapon(ai) {
        const time = this.time.now;
        if (time < this.weaponsEnabledAt) return;
        if (ai.isStunned || ai.hasFinished || this.raceFinished) return;
        if (time < ai.lastFiredTime + ai.fireCooldown) return;

        // Find the closest valid target: the player or another AI racer
        let target = null;
        let bestDist = Infinity;

        if (!this.player.isStunned && !this.raceFinished) {
            const d = Math.abs(ai.x - this.player.x);
            if (d < bestDist) {
                bestDist = d;
                target = this.player;
            }
        }

        if (this.aiRacers) {
            this.aiRacers.forEach(other => {
                if (other === ai || other.isStunned || other.hasFinished) return;
                const d = Math.abs(ai.x - other.x);
                if (d < bestDist) {
                    bestDist = d;
                    target = other;
                }
            });
        }

        if (!target || bestDist > ai.fireRange) return;

        ai.lastFiredTime = time;

        const facing = ai.x < target.x ? 1 : -1;
        const spawnX = ai.x + (facing * 30);
        const spawnY = ai.y;

        const projectile = this.add.circle(spawnX, spawnY, 5, 0xff5555);
        this.physics.add.existing(projectile);
        this.aiProjectiles.add(projectile);
        projectile.body.setVelocityX(400 * facing);
        projectile.damage = 10;
        projectile.isAIProjectile = true;
        projectile.firedBy = ai;

        this.time.delayedCall(3000, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    // ====================================================================
    // PROJECTILE COLLISIONS
    // ====================================================================

    setupProjectileAICollision() {
        if (!this.projectiles || !this.aiRacers) return;

        this.physics.add.overlap(this.projectiles, this.aiRacers, (a, b) => {
            const projectile = a.weaponType !== undefined ? a : b;
            const ai = a.weaponType !== undefined ? b : a;
            this.hitAIRacer(projectile, ai);
        });
    }

    setupAIProjectileAICollision() {
        if (!this.aiProjectiles || !this.aiRacers) return;

        this.physics.add.overlap(this.aiProjectiles, this.aiRacers, (a, b) => {
            const proj = a.isAIProjectile ? a : b;
            const ai = a.isAIProjectile ? b : a;

            if (!proj || !proj.active) return;
            if (proj.firedBy === ai) return;

            this.hitAIRacer(proj, ai);
        });
    }

    setupAIProjectilePlayerCollision() {
        if (!this.aiProjectiles || !this.player) return;

        this.physics.add.overlap(this.aiProjectiles, this.player, (a, b) => {
            const proj = a.isAIProjectile ? a : b;
            const damage = proj.damage || 0;

            if (proj && proj.active) {
                proj.destroy();
            }
            this.hitPlayer(damage);
        });
    }

    // ====================================================================
    // COMBAT / DAMAGE
    // ====================================================================

    hitPlayer(damage = 0) {
        if (this.player.isDead || this.raceFinished) return;
        if (this.isInvulnerable(this.player)) return;

        this.damageCar(this.player, damage);
        if (!this.player.isDead) this.flashHit(this.player);
    }

    hitAIRacer(projectile, ai) {
        if (ai.isDead || ai.isDefeated || ai.hasFinished) return;
        if (this.isInvulnerable(ai)) return;

        const damage = projectile.damage || 0;
        projectile.destroy();

        this.damageCar(ai, damage);
        if (!ai.isDead) this.flashHit(ai);
    }

    // Quick red flash so a hit is visible without stopping the car
    flashHit(car) {
        car.setTint(0xff8888);
        this.time.delayedCall(100, () => {
            if (!car.isDead) car.clearTint();
        });
    }
    isInvulnerable(car) {
    return this.time.now < (car.invulnerableUntil || 0);
}

// Returns true if this hit destroyed the car
damageCar(car, damage) {
    if (car.isDead || car.isDefeated || car.hasFinished) return false;
    if (this.isInvulnerable(car)) return false;

    car.health = Math.max(0, car.health - damage);
    const isPlayer = car === this.player;
    this.showDamageNumber(car.x, car.y - (isPlayer ? 30 : 20), damage, isPlayer ? '#ffaa00' : '#ff4444');
    if (isPlayer) this.updatePlayerHealthBar();

    if (car.health > 0) return false;
    this.killCar(car);
    return true;
}

killCar(car) {
    car.isDead = true;
    car.isStunned = true;
    car.body.setVelocity(0, 0);
    car.body.setAcceleration(0, 0);
    car.body.checkCollision.none = true;
    car.setTint(0xff0000);
    this.showPickupText(car.x, car.y - 30, car === this.player ? 'WRECKED!' : 'DESTROYED!', '#ff2200');

    this.tweens.add({ targets: car, alpha: 0.25, duration: RESPAWN_DELAY });
    this.time.delayedCall(RESPAWN_DELAY, () => this.respawnCar(car));
}

    respawnCar(car) {
        if (car.hasFinished) return;

        this.tweens.killTweensOf(car);
        const groundY = this.groundHeightFn ? this.groundHeightFn(car.x) : 730;
        car.body.reset(car.x, groundY - car.displayHeight / 2);

        car.rotation = 0;
        car.wasAirborne = false;
        car.totalFlipRotation = 0;
        car.health = car.maxHealth;
        car.isDead = false;
        car.isStunned = false;
        car.body.checkCollision.none = false;
        car.clearTint();
        if (car === this.player) this.updatePlayerHealthBar();

        // Short protection, shown by blinking
        car.invulnerableUntil = this.time.now + RESPAWN_INVULN;
        car.setAlpha(1);
        this.tweens.add({
            targets: car,
            alpha: 0.35,
            duration: 120,
            yoyo: true,
            repeat: Math.floor(RESPAWN_INVULN / 240) - 1,
            onComplete: () => car.setAlpha(1)
        });
    }

    fireRocket() {
        if (!this.rocketCharges || this.rocketCharges <= 0) return;
        if (!this.aiRacers) return;

        const targets = this.aiRacers.filter(ai => !ai.hasFinished && !ai.isDefeated && !ai.isDead);
        if (targets.length === 0) return;
        

        targets.sort((a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x));
        const target = targets[0];

        this.rocketCharges -= 1;
        this.updateWeaponHUD();

        const rocket = this.add.rectangle(this.player.x, this.player.y, 20, 8, 0xff2200);
        this.tweens.add({
            targets: rocket,
            x: target.x,
            y: target.y,
            duration: 300,
            onComplete: () => {
                rocket.destroy();
                this.damageCar(target, target.maxHealth);
            }
        });
    }

    defeatAIRacer(ai) {
        if (ai.isDefeated || ai.hasFinished) return;

        ai.isDefeated = true;
        ai.hasFinished = true;
        ai.health = 0;
        ai.body.setVelocity(0, 0);
        ai.body.setAcceleration(0, 0);
        ai.body.checkCollision.none = true;
        ai.setTint(0xff0000);

        this.showPickupText(ai.x, ai.y - 20, 'DEFEATED!', '#ff2200');
        this.finishOrder.push({ name: `${ai.aiName} (defeated)`, isPlayer: false, isDefeatedEntry: true });
        this.checkAllFinished();
    }

    // ====================================================================
    // FLIPS & LANDING (stick-the-landing boost / crash penalty)
    // ====================================================================

    resolveLanding(car, totalRotation) {
        const TWO_PI = Math.PI * 2;
        const remainder = ((totalRotation % TWO_PI) + TWO_PI) % TWO_PI;
        const distanceFromUpright = Math.min(remainder, TWO_PI - remainder);

        const tolerance = 0.35;
        const completedAFlip = Math.abs(totalRotation) >= TWO_PI * 0.9;

        if (completedAFlip && distanceFromUpright <= tolerance) {
            this.grantFlipBoost(car);
        } else if (completedAFlip) {
            // Attempted a flip but didn't land on the wheels
            this.crashLanding(car);
        }
    }

    grantFlipBoost(car) {
        const boostDuration = 2000; // 2 seconds
        car.flipBoostUntil = this.time.now + boostDuration;
        this.showPickupText(car.x, car.y - 30, 'BOOST!', '#00e5ff');
    }

    crashLanding(car) {
        if (car.isStunned || car.isDefeated || car.hasFinished || this.raceFinished) return;

        car.isStunned = true;
        car.body.setVelocity(0, 0);
        car.body.setAcceleration(0, 0);
        car.setTint(0x888888);
        this.showPickupText(car.x, car.y - 30, 'CRASH!', '#ff4444');

        this.time.delayedCall(1500, () => {
            car.isStunned = false;
            car.clearTint();
        });
    }

    // ====================================================================
    // HUD / UI (health bars, currency, floating text)
    // ====================================================================

    createPlayerHealthBar() {
        this.playerHealthBg = this.add.graphics().setScrollFactor(0);
        this.playerHealthFg = this.add.graphics().setScrollFactor(0);
        this.updatePlayerHealthBar();
    }

    updatePlayerHealthBar() {
        const x = 20, y = 44, w = 150, h = 14;
        const pct = Math.max(0, this.player.health / this.player.maxHealth);

        this.playerHealthBg.clear();
        this.playerHealthBg.fillStyle(0x000000, 0.6);
        this.playerHealthBg.fillRect(x, y, w, h);

        this.playerHealthFg.clear();
        const color = pct > 0.5 ? 0x2ecc71 : (pct > 0.25 ? 0xf1c40f : 0xe74c3c);
        this.playerHealthFg.fillStyle(color);
        this.playerHealthFg.fillRect(x, y, w * pct, h);
    }

    createCurrencyHUD() {
        const progress = loadProgress();
        this.currencyText = this.add.text(20, 64, `CREDITS: $${progress.currency}`, {
            fontFamily: 'Arial Black', fontSize: 14, color: '#f1c40f',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0);
    }

    updateCurrencyHUD() {
        const progress = loadProgress();
        this.currencyText.setText(`CREDITS: $${progress.currency}`);
    }

    drawAIHealthBar(ai) {
        if (!ai.healthBarBg) {
            ai.healthBarBg = this.add.graphics();
            ai.healthBarFg = this.add.graphics();
        }

        if (!ai.visible) {
            ai.healthBarBg.setVisible(false);
            ai.healthBarFg.setVisible(false);
            return;
        }

        const barWidth = 50, barHeight = 6;
        const x = ai.x - barWidth / 2;
        const y = ai.y - ai.displayHeight / 2 - 14;

        ai.healthBarBg.clear();
        ai.healthBarBg.fillStyle(0x000000, 0.6);
        ai.healthBarBg.fillRect(x, y, barWidth, barHeight);

        ai.healthBarFg.clear();
        const pct = Math.max(0, ai.health / ai.maxHealth);
        const color = pct > 0.5 ? 0x2ecc71 : (pct > 0.25 ? 0xf1c40f : 0xe74c3c);
        ai.healthBarFg.fillStyle(color);
        ai.healthBarFg.fillRect(x, y, barWidth * pct, barHeight);
    }

    showDamageNumber(x, y, amount, color = '#ff4444') {
        const txt = this.add.text(x, y, `-${amount}`, {
            fontFamily: 'Arial Black', fontSize: 18, color,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    showPickupText(x, y, text, color = '#2ecc71') {
        const txt = this.add.text(x, y, text, {
            fontFamily: 'Arial Black', fontSize: 18, color,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 30,
            alpha: 0,
            duration: 900,
            onComplete: () => txt.destroy()
        });
    }

    // ====================================================================
    // PICKUPS
    // ====================================================================

    setupPickups(raceLength, count = 5, offsetX = 0) {
        const spacing = raceLength / (count + 1);
        for (let i = 1; i <= count; i++) {
            this.spawnPickup(offsetX + spacing * i);
        }
    }

    spawnPickup(x) {
        let y;
        if (this.groundHeightFn) {
            y = this.groundHeightFn(x) - 20;
        } else if (this.groundLayer) {
            const topY = this.getGroundTopY(x);
            y = (topY !== null ? topY : 690) - 20;
        } else {
            const hillSurfaceY = this.hills ? this.getHillSurfaceY(x) : null;
            y = hillSurfaceY !== null ? hillSurfaceY - 20 : 690;
        }

        const box = this.add.rectangle(x, y, 34, 34, 0xf1c40f).setStrokeStyle(3, 0x8a6d1a);
        const mark = this.add.text(x, y, '?', {
            fontFamily: 'Arial Black', fontSize: 20, color: '#3a2a00'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, 34, 34);
        this.physics.add.existing(zone, true);

        const overlapCollider = this.physics.add.overlap(this.player, zone, () => {
            this.collectPickup(box, mark, zone, overlapCollider);
        });
    }

    collectPickup(box, mark, zone, overlapCollider) {
        if (!box.active) return;

        const rewards = ['money', 'ammo', 'rocket', 'repair'];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];

        if (reward === 'money') {
            const amount = Math.floor(Math.random() * 101) + 50;
            addCurrency(amount);
            this.updateCurrencyHUD();
            this.showPickupText(this.player.x, this.player.y - 40, `+$${amount}`, '#f1c40f');
        } else if (reward === 'ammo') {
            this.weaponAmmo = this.weaponConfigs.map(w => w.maxAmmo);
            this.updateWeaponHUD();
            this.showPickupText(this.player.x, this.player.y - 40, 'AMMO REFILLED', '#3498db');

        } else if (reward === 'rocket') {
            if (this.rocketCharges >= 1) {
                this.showPickupText(this.player.x, this.player.y - 40, 'ROCKET (FULL)', '#888888');
            } else {
                this.rocketCharges = 1;
                this.updateWeaponHUD();
                this.showPickupText(this.player.x, this.player.y - 40, 'ROCKET +1', '#ff2200');
            }

        } else if (reward === 'repair') {
            this.player.health = this.player.maxHealth;
            this.updatePlayerHealthBar();
            this.showPickupText(this.player.x, this.player.y - 40, 'FULL REPAIR', '#2ecc71');
        }

        box.destroy();
        mark.destroy();
        zone.destroy();
        this.physics.world.removeCollider(overlapCollider);
    }

    // ====================================================================
    // AI BEHAVIOR (movement, rubber-banding, flips)
    // ====================================================================

    getRubberBandMultiplier(ai) {
        const gap = this.player.x - ai.x; // positive = AI is behind the player, negative = AI is ahead

        const maxBoost = 1.4;    // up to +30% speed when far behind
        const maxPenalty = 0.55;  // down to -20% speed when far ahead
        const bandRange = 1200;   // distance (px) at which the full effect kicks in

        const clamped = Math.max(-bandRange, Math.min(bandRange, gap));
        const ratio = clamped / bandRange; // -1 (far ahead) to 1 (far behind)

        if (ratio >= 0) {
            return 1 + ratio * (maxBoost - 1);
        } else {
            return 1 + ratio * (1 - maxPenalty);
        }
    }

    updateAIRacer(ai) {
        this.drawAIHealthBar(ai);

        if (ai.isDefeated) {
            this.applyGroundSnapIfAvailable(ai);
            return;
        }

        if (ai.hasFinished) {
            // Keep driving forward off-screen rather than stopping dead
            ai.body.setAccelerationX(300);
            this.applyGroundSnapIfAvailable(ai);
            return;
        }

        if (ai.isStunned) {
            this.applyGroundSnapIfAvailable(ai);
            return;
        }

        const boosted = this.time.now < (ai.flipBoostUntil || 0);
        const rubberBand = this.getRubberBandMultiplier(ai);

        ai.body.setAccelerationX(ai.aiSpeed * rubberBand * (boosted ? 1.6 : 1));
        ai.body.setMaxVelocity(ai.baseMaxVelocity * rubberBand + (boosted ? 80 : 0), 700);

        this.aiFireWeapon(ai);

        const hillSurfaceY = this.groundHeightFn
            ? this.groundHeightFn(ai.x)
            : (this.hills ? this.getHillSurfaceY(ai.x) : null);
        const aiBottom = ai.y + ai.displayHeight / 2;

        let isGrounded = ai.body.touching.down;

        if (hillSurfaceY !== null && aiBottom >= hillSurfaceY - 4 && ai.body.velocity.y >= -60) {
            ai.y = hillSurfaceY - ai.displayHeight / 2;
            ai.body.setVelocityY(0);
            isGrounded = true;
        }

        if (!isGrounded) {
            if (!ai.wasAirborne) {
                ai.wasAirborne = true;
                ai.totalFlipRotation = 0;

                const willFlip = Math.random() < 0.5; // 50% chance it attempts a flip this jump

                if (willFlip) {
                    ai.flipLimit = (Math.random() < 0.5 ? 1 : 2) * Math.PI * 2;
                    ai.flipDir = Math.random() < 0.5 ? 1 : -1;
                    ai.flipSpeed = 0.07 + Math.random() * 0.02;
                } else {
                    ai.flipLimit = 0; // no flip this time — stays level in the air
                }
            }

            if (Math.abs(ai.totalFlipRotation) < ai.flipLimit) {
                const delta = ai.flipDir * ai.flipSpeed;
                ai.rotation += delta;
                ai.totalFlipRotation += delta;
            }
            // once the cap is hit, rotation holds steady until it lands — no spamming
        } else {
            if (ai.wasAirborne) {
                this.resolveLanding(ai, ai.totalFlipRotation);
            }
            ai.wasAirborne = false;
            ai.rotation = 0;
        }
    }

    // ====================================================================
    // TRACK GEOMETRY (ramps, hills)
    // ====================================================================



    generateRandomHills(trackWidth, count = 6, options = {}) {
        const {
            minHeight = 180,
            maxHeight = 350,
            minWidth = 250,
            maxWidth = 500,
            startBuffer = 400,
            endBuffer = 400,
            minGap = 150,
            maxGap = 350,
            excludeZones = []
        } = options;

        const hills = [];
        let cursor = startBuffer;

        const overlapsExclusion = (start, end) => {
            return excludeZones.some(zone => start < zone.end && end > zone.start);
        };

        for (let i = 0; i < count; i++) {
            const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
            const peakHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

            for (const zone of excludeZones) {
                if (overlapsExclusion(cursor, cursor + width) && cursor < zone.end) {
                    cursor = zone.end + 100;
                }
            }

            if (cursor + width > trackWidth - endBuffer) break;

            hills.push({ startX: cursor, width, peakHeight });

            const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
            cursor += width + gap;
        }

        return hills;
    }

    setupHills(hillsData) {
        this.hills = hillsData || [];
    }

    getHillSurfaceY(x) {
        for (const hill of this.hills) {
            if (x >= hill.startX && x <= hill.startX + hill.width) {
                const t = (x - hill.startX) / hill.width;
                const offset = hill.peakHeight * Math.sin(Math.PI * t);
                return 730 - offset;
            }
        }
        return null;
    }

    // --- Tiled / math-based ground helpers (used by tracks with a Tiled
    // visual map driven by a smooth groundHeightFn instead of a real collider) ---

    setupTiledGround(mapKey, tilesetName, imageKey, layerName = 'Ground') {
        this.map = this.make.tilemap({ key: mapKey });
        const tileset = this.map.addTilesetImage(tilesetName, imageKey);
        this.groundLayer = this.map.createLayer(layerName, tileset, 0, 0);
        this.groundLayer.setDepth(-10);
        // No collider here — ground collision is handled by this.groundHeightFn,
        // set per-track (see Track1.js), which keeps movement smooth.
    }

    getGroundTopY(x) {
        if (!this.groundLayer || !this.map) return null;
        const tileX = this.map.worldToTileX(x);
        for (let tileY = 0; tileY < this.map.height; tileY++) {
            const tile = this.groundLayer.getTileAt(tileX, tileY);
            if (tile) {
                return tileY * this.map.tileHeight;
            }
        }
        return this.map.heightInPixels;
    }

    snapToGround(sprite) {
        const groundTopY = this.groundHeightFn
            ? this.groundHeightFn(sprite.x)
            : this.getGroundTopY(sprite.x);
        if (groundTopY !== null && groundTopY !== undefined) {
            sprite.y = groundTopY - sprite.displayHeight / 2;
        }
    }

    isSpriteGrounded(sprite) {
        if (this.groundHeightFn) {
            const groundY = this.groundHeightFn(sprite.x);
            const bottom = sprite.y + sprite.displayHeight / 2;
            return groundY !== null && bottom >= groundY - 6 && sprite.body.velocity.y >= -60;
        }
        return sprite.body.touching.down;
    }

    applyGroundSnapIfAvailable(sprite) {
        if (!this.groundHeightFn) return;
        const groundY = this.groundHeightFn(sprite.x);
        const bottom = sprite.y + sprite.displayHeight / 2;
        if (groundY !== null && bottom >= groundY - 4 && sprite.body.velocity.y >= -60) {
            sprite.y = groundY - sprite.displayHeight / 2;
            sprite.body.setVelocityY(0);
        }
    }
    applyGroundSnapIfAvailable(sprite) {
        if (!this.groundHeightFn) return;
        const groundY = this.groundHeightFn(sprite.x);
        const bottom = sprite.y + sprite.displayHeight / 2;
        if (groundY !== null && bottom >= groundY - 4 && sprite.body.velocity.y >= -60) {
                sprite.y = groundY - sprite.displayHeight / 2;
                sprite.body.setVelocityY(0);
        }
    }

    // ====================================================================
    // RACE FLOW (finish line, results, pause)
    // ====================================================================

    getRewardForPosition(position) {
        const rewards = this.rewardTable || { 1: 100, 2: 75, 3: 50 };
        return rewards[position] || 0;
    }

    setupFinishLine(x) {
        this.finishX = x;
        this.createRaceHUD();
        this.add.rectangle(x, 400, 10, 700, 0xff0000, 0.8);
        this.finishLine = this.add.zone(x, 400, 10, 700);
        this.physics.add.existing(this.finishLine, true);

        this.finishOrder = [];

        this.physics.add.overlap(this.player, this.finishLine, () => {
            if (!this.raceFinished) {
                this.raceFinished = true;
                this.finishOrder.push({ name: 'Player', isPlayer: true });
                this.player.body.checkCollision.none = true;
                this.player.isStunned = false;
                this.player.clearTint();
                this.checkAllFinished();

                this.time.delayedCall(2000, () => {
                    this.player.setVisible(false);
                    this.player.body.enable = false;
                });
            }
        });

        if (this.aiRacers) {
            this.aiRacers.forEach(ai => {
                this.physics.add.overlap(ai, this.finishLine, () => {
                    if (!ai.hasFinished) {
                        ai.hasFinished = true;
                        ai.body.checkCollision.none = true;
                        this.finishOrder.push({ name: ai.aiName, isPlayer: false });
                        this.checkAllFinished();

                        this.time.delayedCall(2000, () => {
                            ai.setVisible(false);
                            ai.body.enable = false;
                        });
                    }
                });
            });
        }
    }

    checkAllFinished() {
        const totalRacers = 1 + (this.aiRacers ? this.aiRacers.length : 0);

        if (this.finishOrder.length >= totalRacers) {
            const sortedStandings = [...this.finishOrder].sort((a, b) => {
                if (a.isDefeatedEntry === b.isDefeatedEntry) return 0;
                return a.isDefeatedEntry ? 1 : -1;
            });

            const playerPosition = sortedStandings.findIndex(entry => entry.isPlayer) + 1;
            const reward = this.getRewardForPosition(playerPosition);

            if (reward > 0) {
                addCurrency(reward);
            }

            this.time.delayedCall(500, () => {
                this.scene.start('Results', {
                    standings: sortedStandings,
                    playerPosition,
                    playerReward: reward
                });
            });
        }
    }

    pauseGame() {
        if (this.raceFinished) return; // no pausing once you've crossed the line

        // Remember how much of the weapon lockout was left (see the resume fix in update())
        this.weaponsRemaining = Math.max(0, this.weaponsEnabledAt - this.time.now);
        this.justResumed = true;

        this.scene.launch('PauseMenu', {
            parentKey: this.scene.key,
            weaponIndex: this.selectedWeaponIndex,
            carIndex: this.selectedCarIndex
        });
        this.scene.pause();
    }

    createRaceHUD() {
    const w = this.cameras.main.width;

    this.posText = this.add.text(w - 20, 20, '', {
        fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
        stroke: '#000000', strokeThickness: 5
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(900);

    this.progressGfx = this.add.graphics().setScrollFactor(0).setDepth(900);
}
    // ====================================================================
    // Race HUD
    // ====================================================================
    updateRaceHUD() {
        if (!this.posText || !this.finishX) return;

        const w = this.cameras.main.width;
        const ais = this.aiRacers || [];
        const total = 1 + ais.length;

        // Place = 1 + number of live AI racers ahead of the player
        const ahead = ais.filter(ai => !ai.isDefeated && ai.x > this.player.x).length;
        const place = ahead + 1;
        const suffix = place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th';
        this.posText.setText(`${place}${suffix} / ${total}`);
        this.posText.setColor(place === 1 ? '#f1c40f' : '#ffffff');

        // Progress bar across the top of the screen
        const barW = 320, barH = 10;
        const barX = (w - barW) / 2, barY = 24;
        const g = this.progressGfx;
        g.clear();
        g.fillStyle(0x000000, 0.6);
        g.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        g.fillStyle(0x444444, 1);
        g.fillRect(barX, barY, barW, barH);

        const markerX = (car) => barX + Math.max(0, Math.min(1, car.x / this.finishX)) * barW;

        ais.forEach(ai => {
            if (ai.isDefeated) return;
            g.fillStyle(0xe74c3c, 1);
            g.fillCircle(markerX(ai), barY + barH / 2, 5);
        });
        g.fillStyle(0x2ecc71, 1);
        g.fillCircle(markerX(this.player), barY + barH / 2, 7);
    }

    // ====================================================================
    // MAIN UPDATE LOOP
    // ====================================================================

    update(time, frameDelta) {

        if (!this.raceStarted) {
            this.player.body.setVelocity(0, 0);
            this.player.body.setAcceleration(0, 0);
            if (this.aiRacers) {
                this.aiRacers.forEach(ai => {
                    ai.body.setVelocity(0, 0);
                    ai.body.setAcceleration(0, 0);
                });
            }
            return;
        }

        // After resuming, restore the remaining weapon lockout time
        if (this.justResumed) {
            this.weaponsEnabledAt = this.time.now + this.weaponsRemaining;
            this.justResumed = false;
        }

        // Pause on ESC or P (edge-detected so holding the key doesn't retrigger)
        const pauseDown = this.pauseKeys.ESC.isDown || this.pauseKeys.P.isDown;
        if (pauseDown && !this.prevPauseDown) {
            this.prevPauseDown = true;
            this.pauseGame();
            return;
        }
        this.prevPauseDown = pauseDown;

        const player = this.player;

        if (this.aiRacers) {
            this.aiRacers.forEach(ai => this.updateAIRacer(ai));
        }

        this.updateWeaponHUD();
        this.updateRaceHUD();

        if (this.wasd.R.isDown && !this.prevRDown) {
            this.fireRocket();
        }
        this.prevRDown = this.wasd.R.isDown;

        if (this.raceFinished) {
            // Auto-drive forward off-screen, ignore all input/combat
            player.body.setAccelerationX(400);

            const hillSurfaceY = this.groundHeightFn
                ? this.groundHeightFn(player.x)
                : (this.hills ? this.getHillSurfaceY(player.x) : null);
            const playerBottom = player.y + player.displayHeight / 2;
            if (hillSurfaceY !== null && playerBottom >= hillSurfaceY - 4 && player.body.velocity.y >= -60) {
                player.y = hillSurfaceY - player.displayHeight / 2;
                player.body.setVelocityY(0);
            }
            return;
        }

        if (player.isStunned) {
            this.applyGroundSnapIfAvailable(player);
            return;
        }

        const boosted = this.time.now < (player.flipBoostUntil || 0);
        const accel = boosted ? 640 : 440;
        player.setMaxVelocity(boosted ? 470 : 370, 700);

        if (this.wasd.W.isDown) {
            player.body.setAccelerationX(accel);
        } else if (this.wasd.S.isDown) {
            player.body.setAccelerationX(-accel);
        } else {
            player.body.setAccelerationX(0);
        }

        if (this.wasd.SPACE.isDown) {
            this.fireWeapon();
        }

        const hillSurfaceY = this.groundHeightFn
            ? this.groundHeightFn(player.x)
            : (this.hills ? this.getHillSurfaceY(player.x) : null);
        const playerBottom = player.y + player.displayHeight / 2;

        let isGrounded = player.body.touching.down;

        if (hillSurfaceY !== null && playerBottom >= hillSurfaceY - 4 && player.body.velocity.y >= -60) {
            player.y = hillSurfaceY - player.displayHeight / 2;
            player.body.setVelocityY(0);
            isGrounded = true;
        }

        if (!isGrounded) {
            if (!player.wasAirborne) {
                player.wasAirborne = true;
                player.totalFlipRotation = 0;
            }

            const rotationSpeed = 0.12;
            const rotationAmount = rotationSpeed * (frameDelta / 26.67);

            let rotation = 0;

            if (this.wasd.A.isDown) {
                rotation = -rotationAmount;
            } else if (this.wasd.D.isDown) {
                rotation = rotationAmount;
            }

            player.rotation += rotation;
            player.totalFlipRotation += rotation;

        } else {
            if (player.wasAirborne) {
                this.resolveLanding(player, player.totalFlipRotation);
            }

            player.wasAirborne = false;
            player.rotation = 0;
        }
    }
}