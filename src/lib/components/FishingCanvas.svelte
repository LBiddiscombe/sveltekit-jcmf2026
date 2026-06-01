<script lang="ts">
	import { onMount } from 'svelte';
	import p5 from 'p5';
	import anglerPngUrl from '$lib/assets/images/game/angler.png?url';

	interface Props {
		phase: string;
		pegImageUrl: string;
		fishWeightOz: number;
		lineMaxOz: number;
		rodMultiplier: number;
		castStrength: string;
		pattern: number[];
		stepMs: number;
		onResult?: (result: 'caught' | 'lost') => void;
		anglerSilhouetteUrl?: string;
	}

	let {
		phase = 'idle',
		pegImageUrl = '',
		fishWeightOz = 0,
		lineMaxOz = 100,
		rodMultiplier = 1.0,
		castStrength = 'Medium',
		pattern = [1, 1, 0, 0],
		stepMs = 1000,
		onResult = () => {},
		anglerSilhouetteUrl = ''
	}: Props = $props();

	let container: HTMLDivElement;
	let p5Inst: p5 | null = null;

	$effect(() => {
		if (phase === 'reeling') {
			container?.focus();
		}
	});

	let reelingParams = $state({
		weight: 0,
		lineMaxOz: 100,
		rodMultiplier: 1.0,
		castStrength: 'Medium',
		pattern: [1, 1, 0, 0],
		stepMs: 1000,
		active: false
	});

	let minigameResolve: ((result: 'caught' | 'lost') => void) | null = null;

	let overTensionTime = 0;
	let minigameState: 'active' | 'caught' | 'lost' | 'idle' = 'idle';
	let bankY = 0;
	let splashes: {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		decay: number;
		size: number;
	}[] = [];

	$effect(() => {
		if (phase === 'reeling' && fishWeightOz > 0 && !reelingParams.active) {
			reelingParams = {
				weight: fishWeightOz,
				lineMaxOz,
				rodMultiplier,
				castStrength,
				pattern,
				stepMs,
				active: true
			};
			overTensionTime = 0;
			minigameState = 'active';
			minigameResolve = (result: 'caught' | 'lost') => {
				minigameResolve = null;
				reelingParams = {
					weight: 0,
					lineMaxOz: 100,
					rodMultiplier: 1.0,
					castStrength: 'Medium',
					pattern: [1, 1, 0, 0],
					stepMs: 1000,
					active: false
				};
				onResult(result);
			};
		} else if (phase !== 'reeling' && reelingParams.active) {
			minigameResolve = null;
			reelingParams = {
				weight: 0,
				lineMaxOz: 100,
				rodMultiplier: 1.0,
				castStrength: 'Medium',
				pattern: [1, 1, 0, 0],
				stepMs: 1000,
				active: false
			};
		}
	});

	onMount(() => {
		let anglerImage: p5.Image | null = null;
		let pegImage: p5.Image | null = null;
		let pegUrlLoaded = '';
		let pegLoading = false;
		let activeAtSetup = false;

		const sketch = (p: p5) => {
			let angler: ReturnType<typeof createAngler>;
			let fish: ReturnType<typeof createFish>;

			function createAngler(options: { rodMultiplier?: number; lineMaxOz?: number } = {}) {
				return {
					rodMultiplier: options.rodMultiplier ?? 1.0,
					lineMaxOz: options.lineMaxOz ?? 100,
					pull: 0,
					tension: 0,
					a: 5,
					rodEnd: { x: 0, y: 0 },
					update() {
						if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
							this.a = p.map(p.mouseX, 0, p.width, -30, 30, true);
							if (p.mouseIsPressed || p.keyIsDown(' ')) {
								this.pull = p.lerp(this.pull, 2, p.deltaTime / 400);
								this.tension =
									(this.pull * fish.pull * fish.stamina * fish.weight) /
									(this.lineMaxOz * this.rodMultiplier);
							} else {
								this.pull = p.lerp(this.pull, 1, p.deltaTime / 200);
								this.tension =
									(fish.pull * fish.stamina * fish.weight) / (this.lineMaxOz * this.rodMultiplier);
							}
						}
					}
				};
			}

			function createFish(
				options: { weight?: number; y?: number; pattern?: number[]; stepMs?: number } = {}
			) {
				return {
					x: p.width * 0.5,
					y: options.y ?? p.height * 0.2,
					weight: options.weight ?? 16,
					pattern: options.pattern ?? [1, 0, 0],
					stepMs: options.stepMs ?? 1000,
					stamina: 1,
					isPulling: false,
					pull: 0,
					xoff: 1000,
					patternIdx: 0,
					dt: 0,
					update() {
						this.dt += p.deltaTime;
						if (this.dt >= this.stepMs) {
							this.patternIdx = (this.patternIdx + 1) % this.pattern.length;
							this.dt = 0;
							this.isPulling = this.pattern[this.patternIdx] > 0;
						}
						this.pull = p.lerp(this.pull, this.pattern[this.patternIdx], p.deltaTime / 400);
						this.x += (p.noise(this.xoff) - 0.5) * p.map(this.weight, 1, 1000, 1, 20);
						this.x = p.constrain(this.x, 20, p.width - 20);
						this.y -= this.pull * 0.5;
						this.stamina -= this.pull * p.deltaTime * 0.00001;
						this.stamina = Math.max(this.stamina, 0.1);
						this.xoff += 0.01;
					}
				};
			}

			function castFishY(castStr: string): number {
				const yMap: Record<string, number> = { Short: 0.6, Medium: 0.4, Long: 0.2 };
				return (yMap[castStr] ?? 0.4) * p.height;
			}

			function resetToIdleView() {
				fish.x = p.width * 0.5;
				fish.y = castFishY(castStrength);
				angler.a = 5;
				angler.pull = 1;
				angler.tension = 0;
			}

			function drawWater() {
				p.push();
				if (phase === 'bite') {
					p.translate(p.random(-3, 3), p.random(-3, 3));
				}
				if (pegImage && pegImage.width > 0) {
					p.image(pegImage, 0, 0, p.width, p.height);
				}
				p.pop();
			}

			function drawRodSection(h: number, sw: number, power: number) {
				h *= 0.7;
				sw *= 0.8;
				if (h > 10) {
					p.push();
					p.rotate(((-angler.a / 2) * power * p.PI) / 180);
					p.strokeWeight(sw);
					p.line(0, 0, 0, -h);
					p.translate(0, -h);
					drawRodSection(h, sw, power);
					p.pop();
				} else {
					const ctx = p.drawingContext as CanvasRenderingContext2D;
					const m = ctx.getTransform();
					const pd = p.pixelDensity();
					angler.rodEnd = { x: m.e / pd, y: m.f / pd };
				}
			}

			function drawSurfaceRipple() {
				const rx = fish.x;
				const ry = fish.y;

				p.push();
				p.noFill();

				for (let i = 0; i < 2; i++) {
					const phase = i * p.PI;
					const size = 8 + i * 8 + p.sin(p.frameCount * 0.06 + phase) * 2.5;
					const alpha = p.map(i, 0, 1, 70, 35);
					p.stroke(200, 235, 255, alpha);
					p.strokeWeight(1.2 - i * 0.4);
					p.ellipse(rx, ry, size, size * 0.35);
				}

				p.fill(210, 240, 255, 40);
				p.noStroke();
				p.ellipse(rx, ry, 4, 1.5);

				p.pop();
			}

			function updateSplashes() {
				if (fish.isPulling && p.frameCount % 3 === 0) {
					for (let i = 0; i < 3; i++) {
						const angle = p.random(p.TWO_PI);
						const speed = p.random(0.4, 1);
						splashes.push({
							x: fish.x + p.cos(angle) * p.random(1, 4),
							y: fish.y + p.sin(angle) * p.random(1, 4),
							vx: p.cos(angle) * speed,
							vy: p.sin(angle) * speed,
							life: 1,
							decay: p.random(0.025, 0.045),
							size: p.random(1.5, 3)
						});
					}
				}

				p.noStroke();
				for (let i = splashes.length - 1; i >= 0; i--) {
					const s = splashes[i];
					s.x += s.vx;
					s.y += s.vy;
					s.vx *= 0.96;
					s.vy *= 0.96;
					s.life -= s.decay;
					if (s.life <= 0) {
						splashes.splice(i, 1);
						continue;
					}
					p.fill(200, 235, 255, s.life * 150);
					p.circle(s.x, s.y, s.size * s.life);
				}
			}

			function drawGame() {
				p.push();
				p.translate(p.width / 2, p.height);
				p.scale(0.625);
				p.rotate((angler.a * 2 * angler.pull * p.PI) / 180);
				p.stroke(0);
				p.strokeWeight(16);
				p.line(-20, -20, 0, -60);
				p.line(20, -20, 0, -60);
				p.translate(0, -60);
				drawRodSection(120, 6, angler.pull);
				p.pop();

				p.push();
				p.translate(p.width / 2, p.height);
				p.scale(0.625);
				p.rotate(((angler.a / 2) * p.PI) / 180);
				if (anglerImage) {
					p.image(anglerImage, -64, -148, 128, 128);
				}
				p.pop();

				p.stroke(0);
				p.strokeWeight(0.3);
				p.line(angler.rodEnd.x, angler.rodEnd.y, fish.x, fish.y);

				drawSurfaceRipple();

				if (minigameState === 'active') {
					const gaugeY = p.constrain(fish.y - 20, 8, p.height - 20);
					const offscreen = fish.y < 28 && fish.isPulling;
					if (offscreen) {
						p.noFill();
						p.stroke(255, 200, 50);
						p.strokeWeight(2);
						p.rect(fish.x - 17, gaugeY - 2, 34, 12);
					}
					p.fill(255);
					p.noStroke();
					p.rect(fish.x - 15, gaugeY, 30, 8);
					const tensionClamped = Math.min(angler.tension, 1);
					const tensionColor = p.lerpColor(
						p.color(64, 255, 0),
						p.color(255, 64, 0),
						tensionClamped
					);
					p.fill(tensionColor);
					p.rect(fish.x - 15, gaugeY, 30 * tensionClamped, 8);

					if (fish.isPulling) {
						p.fill(255, 200, 50);
						p.circle(p.width - 8, 22, 6);
					} else {
						p.fill(100);
						p.circle(p.width - 8, 22, 6);
					}
				}
			}

			function update() {
				if (p.mouseIsPressed || p.keyIsDown(' ')) {
					fish.y += p.map(angler.tension, 0, 1, 2, 0.1, true);
					if (p.mouseX <= p.width && p.mouseX >= 0 && p.mouseY <= p.height && p.mouseY >= 0) {
						fish.x = p.lerp(fish.x, p.mouseX, p.deltaTime / 5000);
					}
				}

				if (fish.y >= bankY) {
					minigameState = 'caught';
				}

				if (angler.tension >= 1.0) {
					overTensionTime += p.deltaTime;
				} else {
					overTensionTime = 0;
				}

				if (overTensionTime >= 500) {
					minigameState = 'lost';
				}
			}

			p.setup = async () => {
				const renderer = p.createCanvas(400, 400);
				renderer.elt.addEventListener(
					'touchstart',
					(e: TouchEvent) => {
						e.preventDefault();
					},
					{ passive: false }
				);
				anglerImage = await p.loadImage(anglerSilhouetteUrl || anglerPngUrl);

				bankY = p.height * 0.8;

				angler = createAngler({ rodMultiplier, lineMaxOz });
				fish = createFish({ weight: 50, y: p.height * 0.5, pattern, stepMs });
				resetToIdleView();
			};

			p.draw = () => {
				if (reelingParams.active && !activeAtSetup) {
					activeAtSetup = true;
					p.loop();
					minigameState = 'active';
					overTensionTime = 0;
					angler = createAngler({
						rodMultiplier: reelingParams.rodMultiplier,
						lineMaxOz: reelingParams.lineMaxOz
					});
					fish = createFish({
						weight: reelingParams.weight,
						y: castFishY(reelingParams.castStrength),
						pattern: reelingParams.pattern,
						stepMs: reelingParams.stepMs
					});
				} else if (!reelingParams.active && activeAtSetup) {
					activeAtSetup = false;
				}

				if (pegImageUrl && pegImageUrl !== pegUrlLoaded && !pegLoading) {
					pegLoading = true;
					p.loadImage(pegImageUrl, (img: p5.Image) => {
						pegImage = img;
						pegUrlLoaded = pegImageUrl;
						pegLoading = false;
					});
				}

				p.background(100, 150, 200);
				drawWater();

				if (activeAtSetup && minigameState === 'active') {
					angler.update();
					fish.update();
					update();
					updateSplashes();
				}

				if (!activeAtSetup) {
					fish.y = castFishY(castStrength);
				}

				drawGame();

				if (minigameState !== 'active' && activeAtSetup) {
					const resolve = minigameResolve;
					if (resolve) {
						activeAtSetup = false;
						resetToIdleView();
						const result = minigameState;
						minigameState = 'idle';
						resolve(result as 'caught' | 'lost');
					}
				}
			};

			p.mousePressed = () => {
				/* p.mouseIsPressed handled in update() */
			};
			p.mouseReleased = () => {
				/* p.mouseIsPressed handled in update() */
			};
		};

		p5.disableFriendlyErrors = true;
		p5Inst = new p5(sketch, container);

		return () => {
			p5Inst?.remove();
			p5Inst = null;
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={container}
	tabindex="0"
	role="application"
	class="aspect-square w-full overflow-hidden rounded-xl bg-surface/20 select-none"
	style="-webkit-touch-callout: none; touch-action: none"
></div>
