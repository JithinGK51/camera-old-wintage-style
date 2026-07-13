import { FilterPreset } from "../types";

// Renders a high-fidelity physical Polaroid scan onto a 2D canvas.
// This allows downloading/sharing of a fully framed photo with textures, filters, and handwritten caption baked in.
export function renderPolaroidCard(
  imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  preset: FilterPreset,
  captionText: string,
  dateString: string,
  frameStyle: "POLAROID" | "BOUNTY" = "POLAROID"
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }

    if (frameStyle === "BOUNTY") {
      // 1. Draw Bounty Poster Parchment Paper Background
      ctx.fillStyle = "#EADBBF"; // Warm parchment yellow-brown
      ctx.fillRect(0, 0, 600, 720);

      // Add double border line around the poster
      ctx.strokeStyle = "#382313";
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 560, 680);
      
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 26, 548, 668);

      // Fine aged wood/parchment grain texture noise
      const imgData = ctx.getImageData(0, 0, 600, 720);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 10;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise - 2));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise - 4));
      }
      ctx.putImageData(imgData, 0, 0);

      // 2. Draw "WANTED" header text
      ctx.fillStyle = "#382313";
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      // Draw Woodblock Serif WANTED
      ctx.font = "800 68px 'Impact', 'Georgia', 'Arial Black', serif";
      ctx.textAlign = "center";
      ctx.fillText("WANTED", 300, 95);

      // Reset shadows
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 3. Draw "DEAD OR ALIVE" in small banner/text
      ctx.font = "bold 15px 'Georgia', serif";
      ctx.fillStyle = "#54371E";
      ctx.fillText("DEAD OR ALIVE", 300, 125);

      // 4. Draw Photo Container Frame
      const px = 70;
      const py = 150;
      const pw = 460;
      const ph = 340;

      // Draw a thick dark board border around the photo slot
      ctx.fillStyle = "#26170C";
      ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);

      // Clip photo to standard container boundaries
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();

      // Get crop details
      let sx = 0, sy = 0, sw = 0, sh = 0;
      if (imageSource instanceof HTMLVideoElement) {
        const vw = imageSource.videoWidth;
        const vh = imageSource.videoHeight;
        sw = vw;
        sh = (vw * ph) / pw;
        sx = 0;
        sy = (vh - sh) / 2;
      } else if (imageSource instanceof HTMLImageElement) {
        const iw = imageSource.naturalWidth;
        const ih = imageSource.naturalHeight;
        sw = iw;
        sh = (iw * ph) / pw;
        sx = 0;
        sy = (ih - sh) / 2;
      } else {
        const cw = imageSource.width;
        const ch = imageSource.height;
        sw = cw;
        sh = (cw * ph) / pw;
        sx = 0;
        sy = (ch - sh) / 2;
      }

      // Enforce heavy sepia/vintage styling for Wanted posters to look highly authentic
      const bountyFilter = `
        sepia(80%)
        grayscale(15%)
        contrast(120%)
        brightness(95%)
        saturate(85%)
      `.trim().replace(/\s+/g, ' ');

      ctx.filter = bountyFilter;
      ctx.drawImage(imageSource, sx, sy, sw, sh, px, py, pw, ph);
      ctx.filter = "none";

      // Draw light leaks or scratches if applicable
      if (preset.lightLeak > 0) {
        ctx.globalCompositeOperation = "screen";
        const grad = ctx.createRadialGradient(px, py, 0, px, py, pw);
        grad.addColorStop(0, "rgba(255, 130, 0, 0.4)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, pw, ph);
        ctx.globalCompositeOperation = "source-over";
      }

      // Vignette inside the photo frame
      const vigGrad = ctx.createRadialGradient(px + pw/2, py + ph/2, pw*0.3, px + pw/2, py + ph/2, pw*0.7);
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, "rgba(51,30,11,0.45)");
      ctx.fillStyle = vigGrad;
      ctx.fillRect(px, py, pw, ph);

      ctx.restore(); // Restore from clip

      // 5. Draw Name of Pirate
      // Format caption text as high-impact pirate name
      let pirateName = (captionText || "MONKEY D LUFFY").trim().toUpperCase();
      // If name is short, let's give it the "D." treatment to make it feel authentic!
      if (pirateName.length > 0 && pirateName.length < 15 && !pirateName.includes("·D·") && !pirateName.includes(" D. ")) {
        const words = pirateName.split("·").join(" ").split(" ");
        if (words.length >= 2) {
          pirateName = `${words[0]}·D·${words.slice(1).join("·")}`;
        } else {
          pirateName = `${pirateName}·D·ROGERS`;
        }
      }
      pirateName = pirateName.replace(/\s+/g, "·");

      ctx.fillStyle = "#382313";
      ctx.font = "800 36px 'Georgia', 'Arial Black', serif";
      ctx.textAlign = "center";
      ctx.fillText(pirateName, 300, 540);

      // 6. Draw Bounty Price Symbol ฿ and value
      let numericBounty = 3000000000;
      if (captionText) {
        let hash = 0;
        for (let i = 0; i < captionText.length; i++) {
          hash = captionText.charCodeAt(i) + ((hash << 5) - hash);
        }
        const bValues = [30000000, 150000000, 320000000, 500000000, 1500000000, 3000000000];
        numericBounty = bValues[Math.abs(hash) % bValues.length];
      }
      
      const formattedBounty = numericBounty.toLocaleString() + " -";
      
      ctx.font = "bold 26px 'Georgia', serif";
      ctx.fillText("฿ " + formattedBounty, 300, 590);

      // 7. Draw "MARINE" Seal / Stamp at bottom
      ctx.fillStyle = "rgba(56, 35, 19, 0.45)";
      ctx.font = "bold 13px 'Courier New', Courier, monospace";
      ctx.fillText("MARINE", 300, 650);

      // Small anchor/seal decorative graphics
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(56, 35, 19, 0.3)";
      ctx.beginPath();
      ctx.moveTo(240, 646);
      ctx.lineTo(190, 646);
      ctx.moveTo(360, 646);
      ctx.lineTo(410, 646);
      ctx.stroke();

      resolve(canvas.toDataURL("image/jpeg", 0.92));
      return;
    }

    // 1. Draw Physical Polaroid Paper Background (warm, thick textured cream)
    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, 600, 720);

    // Subtle paper edge border shadows to simulate a real paper card depth
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 600, 720);

    // Add very fine paper fiber noise
    const imgData = ctx.getImageData(0, 0, 600, 720);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 4;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise)); // G
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // 2. Draw 1:1 Photo Frame Inner Shadow Slot
    ctx.fillStyle = "#120F0D";
    ctx.fillRect(45, 45, 510, 510);

    // Set up photo drawing parameters
    const px = 50;
    const py = 50;
    const pw = 500;
    const ph = 500;

    // 3. Draw Captured Image cropped to square 1:1
    ctx.save();
    // Clip to the photo boundaries
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();

    // Source drawing logic (crop source to square 1:1)
    let sx = 0, sy = 0, sw = 0, sh = 0;
    if (imageSource instanceof HTMLVideoElement) {
      const vw = imageSource.videoWidth;
      const vh = imageSource.videoHeight;
      const size = Math.min(vw, vh);
      sx = (vw - size) / 2;
      sy = (vh - size) / 2;
      sw = size;
      sh = size;
    } else if (imageSource instanceof HTMLImageElement) {
      const iw = imageSource.naturalWidth;
      const ih = imageSource.naturalHeight;
      const size = Math.min(iw, ih);
      sx = (iw - size) / 2;
      sy = (ih - size) / 2;
      sw = size;
      sh = size;
    } else {
      const cw = imageSource.width;
      const ch = imageSource.height;
      const size = Math.min(cw, ch);
      sx = (cw - size) / 2;
      sy = (ch - size) / 2;
      sw = size;
      sh = size;
    }

    // Apply filter configurations inside the save/restore context (CSS-style emulation on Canvas context)
    // Note: Standard browser 2D context supports a ".filter" property that behaves exactly like CSS filters!
    const cssFilter = `
      sepia(${preset.sepia}%)
      grayscale(${preset.grayscale}%)
      contrast(${preset.contrast}%)
      brightness(${preset.brightness}%)
      saturate(${preset.saturate}%)
      hue-rotate(${preset.hueRotate}deg)
      blur(${preset.blur}px)
    `.trim().replace(/\s+/g, ' ');

    ctx.filter = cssFilter;
    ctx.drawImage(imageSource, sx, sy, sw, sh, px, py, pw, ph);
    ctx.filter = "none"; // Reset filter for subsequent layers

    // 4. Draw Warm Light Leak Overlay
    if (preset.lightLeak > 0) {
      ctx.globalCompositeOperation = "screen"; // screen blending
      const grad = ctx.createRadialGradient(
        px + pw * 0.9, py + ph * 0.1, // leak center top-right
        0,
        px + pw * 0.9, py + ph * 0.1,
        pw * 0.8
      );
      const alpha = preset.lightLeak * 0.65;
      grad.addColorStop(0, `rgba(255, 60, 0, ${alpha})`);
      grad.addColorStop(0.3, `rgba(255, 120, 0, ${alpha * 0.6})`);
      grad.addColorStop(0.6, `rgba(255, 0, 150, ${alpha * 0.2})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);
      ctx.globalCompositeOperation = "source-over"; // Reset blending mode
    }

    // 5. Draw Vignette & Grain Layer inside the photo
    const vigGrad = ctx.createRadialGradient(
      px + pw/2, py + ph/2,
      pw * 0.3,
      px + pw/2, py + ph/2,
      pw * 0.72
    );
    const vignetteOpacity = preset.vignette / 100 * 0.6;
    vigGrad.addColorStop(0, "rgba(0,0,0,0)");
    vigGrad.addColorStop(0.8, `rgba(0,0,0,${vignetteOpacity * 0.4})`);
    vigGrad.addColorStop(1, `rgba(0,0,0,${vignetteOpacity})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(px, py, pw, ph);

    // Noise/Dust grain within the photo area
    const pData = ctx.getImageData(px, py, pw, ph);
    const pD = pData.data;
    const grainStrength = preset.grain * 0.7; // Scale down for elegance
    for (let i = 0; i < pD.length; i += 4) {
      const gNoise = (Math.random() - 0.5) * grainStrength;
      pD[i] = Math.min(255, Math.max(0, pD[i] + gNoise));     // R
      pD[i+1] = Math.min(255, Math.max(0, pD[i+1] + gNoise)); // G
      pD[i+2] = Math.min(255, Math.max(0, pD[i+2] + gNoise)); // B
    }
    ctx.putImageData(pData, px, py);

    // Draw some stylized film scratches/scuffs
    if (preset.grain > 25) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      // Draw a vertical hair-like scratch
      ctx.beginPath();
      ctx.moveTo(px + pw * 0.4, py + 10);
      ctx.bezierCurveTo(px + pw * 0.42, py + 150, px + pw * 0.38, py + 300, px + pw * 0.41, py + ph - 20);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.beginPath();
      ctx.moveTo(px + pw * 0.7, py + 80);
      ctx.lineTo(px + pw * 0.71, py + 140);
      ctx.stroke();
    }

    ctx.restore(); // Restores original non-clipped state

    // 6. Draw Subtle Photographic Inner Bevel Shadow around the picture frame
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 4;
    ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);

    // 7. Write Cursive / Poetic Handwritten Caption at bottom
    ctx.fillStyle = "#2D261E";
    // Setup a vintage handwriting style. We fall back to system handwriting fonts or cursive elegant serifs.
    ctx.font = "italic 26px Georgia, 'Apple Chancery', cursive, serif";
    ctx.textAlign = "center";
    ctx.fillText(captionText || "Captured Moment", 300, 615);

    // 8. Draw nostalgic orange digital clock date-stamp (bottom right of picture)
    // Format: '07 13 '26 or custom orange ink
    ctx.fillStyle = "rgba(255, 80, 0, 0.75)";
    ctx.font = "bold 14px 'Courier New', Courier, monospace";
    ctx.textAlign = "right";
    ctx.fillText(dateString, px + pw - 15, py + ph - 15);

    // Add tiny light glow around date stamp
    ctx.shadowColor = "rgba(255, 80, 0, 0.4)";
    ctx.shadowBlur = 4;
    ctx.fillText(dateString, px + pw - 15, py + ph - 15);
    ctx.shadowBlur = 0; // reset shadow

    resolve(canvas.toDataURL("image/jpeg", 0.92));
  });
}

// Collages together 2, 4, or 6 photos into a film-strip style photo collage
export function renderMultiFilmStrip(
  photos: string[],
  title: string
): Promise<string> {
  return new Promise((resolve) => {
    if (photos.length === 0) {
      resolve("");
      return;
    }

    const itemWidth = 320;
    const itemHeight = 380;
    const padding = 20;
    const stripWidth = itemWidth + padding * 2;
    const stripHeight = (itemHeight * photos.length) + (padding * (photos.length + 1)) + 100;

    const canvas = document.createElement("canvas");
    canvas.width = stripWidth;
    canvas.height = stripHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }

    // Draw long black/dark charcoal film strip background
    ctx.fillStyle = "#120F0D";
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    // Draw film sprocket holes on left and right borders
    const sprocketSize = 10;
    const sprocketSpacing = 30;
    ctx.fillStyle = "#FAF7F2";
    
    // Draw sprocket holes
    for (let y = 15; y < stripHeight - 20; y += sprocketSpacing) {
      // Left side sprocket
      ctx.fillRect(8, y, sprocketSize, sprocketSize);
      // Right side sprocket
      ctx.fillRect(stripWidth - 18, y, sprocketSize, sprocketSize);
    }

    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const drawStripContent = () => {
      // Draw individual frames
      loadedImages.forEach((img, idx) => {
        const yOffset = padding + idx * (itemHeight + padding);
        
        // Polaroid paper backing for each photo segment
        ctx.fillStyle = "#FAF7F2";
        ctx.fillRect(padding + 10, yOffset, itemWidth - 20, itemHeight);

        // Render photo
        // Polaroid slot is square inside
        const imgSize = itemWidth - 40;
        ctx.drawImage(img, padding + 20, yOffset + 10, imgSize, imgSize);

        // Small caption placeholder line
        ctx.fillStyle = "#4A3B32";
        ctx.font = "italic 12px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(`Frame #${idx + 1}`, stripWidth / 2, yOffset + itemHeight - 20);
      });

      // Draw bottom brand header
      ctx.fillStyle = "#FAF7F2";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(title.toUpperCase(), stripWidth / 2, stripHeight - 45);
      
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(250, 247, 242, 0.4)";
      ctx.fillText(`RETROCAM MULTI-STRIP • ${new Date().toLocaleDateString()}`, stripWidth / 2, stripHeight - 25);

      resolve(canvas.toDataURL("image/jpeg", 0.90));
    };

    // Load base64 image data into actual HTMLImageElements to draw
    photos.forEach((base64, index) => {
      const img = new Image();
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === photos.length) {
          drawStripContent();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === photos.length) {
          drawStripContent();
        }
      };
      img.src = base64;
    });
  });
}
