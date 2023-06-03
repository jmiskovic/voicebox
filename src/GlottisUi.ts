const color1 = '#46425e';
const color2 = '#5b768d';
const color3 = '#d17c7c';
const color4 = '#f6c6a8';

import {Glottis} from "./Glottis";
import * as GuiUtils from "./GuiUtils";
import {AppTouch} from "./GuiUtils";
import * as Utils from "./Utils";

const baseFreq               = 82.407;  // E2
const baseNote               = 28;
const keyboardTop            = 500;
const keyboardLeft           = 0;
const keyboardWidth          = 1000;
const keyboardHeight         = 100;
const semitones              = 42;

function isBlackKey(note: number) : boolean {
   return [1, 3, 6, 8, 10].includes(note % 12);
}

export class GlottisUi {

   private pitchControlX     = 240;
   private pitchControlY     = 530;

   private glottis:          Glottis;

   private touch:            GuiUtils.AppTouch | undefined;

   constructor(glottis: Glottis) {
      this.glottis = glottis;
   }

   private drawKey(ctx: CanvasRenderingContext2D, isBlack :boolean,x :number, y :number, w :number, h :number) {
     ctx.globalAlpha = 1;
     ctx.fillStyle = isBlack ? color1 : 'white';
     ctx.fillRect(x, y, w, h);
     ctx.lineWidth = 3;
     ctx.globalAlpha = 0.3;
     ctx.strokeStyle = color3;
     ctx.strokeRect(x - 0.3, y - 0.6, w, h);
  }

   public drawBackground(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.fillStyle = color4;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      // Draw the piano keys
      ctx.globalAlpha = 1;
      const keyHeight = keyboardHeight * 0.9;
      const keyWidth = keyboardWidth / semitones;
      for (let i = 0; i < semitones; i++) {
         const isBlack = isBlackKey(baseNote + i);
         if (isBlack) continue;
         let x = keyboardLeft + i * keyWidth;
         let y = keyboardTop;
         let h = keyHeight;
         let w = keyWidth;
         // expand white key onto half of black key
         if (isBlackKey(baseNote + i - 1)) {
            x += -keyWidth * 0.5;
            w += keyWidth * 0.5;
         }
         if (isBlackKey(baseNote + i + 1)) {
            w += keyWidth * 0.5;
         }
         this.drawKey(ctx, isBlack, x, y, w, h);
      }
      for (let i = 0; i < semitones; i++) {
         const isBlack = isBlackKey(baseNote + i);
         if (!isBlack) continue;
         let x = keyboardLeft + i * keyWidth;
         let y = keyboardTop;
         let h = keyHeight * 0.55;
         let w = keyWidth;
         this.drawKey(ctx, isBlack, x, y, w, h);
      }

      ctx.restore();
      ctx.restore();
   }



   public draw(ctx: CanvasRenderingContext2D) {
      this.drawPitchControl(ctx, this.pitchControlX, this.pitchControlY);
   }

   private drawPitchControl(ctx: CanvasRenderingContext2D, x: number, y: number) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const w = 9;
      const h = 15;
      ctx.lineWidth = 4;
      ctx.strokeStyle = color3;
      ctx.fillStyle = color3;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - w, y - h);
      ctx.lineTo(x + w, y - h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x - w, y + h);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.15;
      ctx.fill();
      ctx.restore();
   }

   public handleTouches(touches: AppTouch[]) {
      const glottis = this.glottis;
      if (this.touch && !this.touch.alive) {
         this.touch = undefined;
      }
      if (!this.touch) {
         for (const touch of touches) {
            if (!touch.alive) {
               continue;
            }
            if (touch.y < keyboardTop) {
               continue;
            }
            this.touch = touch;
         }
      }
      if (this.touch) {
         const localX = this.touch.x - keyboardLeft;
         const localY = Utils.clamp(this.touch.y - keyboardTop - 10, 0, keyboardHeight - 26);
         let semitone = semitones * localX / keyboardWidth + 0.5;
         semitone = (glottis.autotune) ? Math.round(semitone) : semitone;
         glottis.targetFrequency = baseFreq * Math.pow(2, semitone / 12);
         const t = Utils.clamp(1 - localY / (keyboardHeight - 28), 0, 1);
         glottis.targetTenseness = 3 * t * t - 2 * t * t * t;
         this.pitchControlX = this.touch.x;
         this.pitchControlY = localY + keyboardTop + 10;
      }
      glottis.isTouched = !!this.touch;
   }
}
