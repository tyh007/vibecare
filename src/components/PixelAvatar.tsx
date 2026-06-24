import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface PixelAvatarProps {
  size?: "small" | "medium" | "large";
  showCoins?: boolean;
}

export const PixelAvatar = ({ size = "medium", showCoins = true }: PixelAvatarProps) => {
  const [hairColor, setHairColor] = useState("brown");
  const [hairstyle, setHairstyle] = useState("long");
  const [eyeColor, setEyeColor] = useState("brown_eyes");
  const [top, setTop] = useState("basic_shirt");
  const [bottom, setBottom] = useState("basic_pants");
  const [accessory, setAccessory] = useState("none");
  const [coins, setCoins] = useState(0);
  
  const pixelSize = size === "small" ? 4 : size === "large" ? 6 : 5;
  const gridWidth = 64;
  const gridHeight = 96;

  // Color palettes
  const hairColors: Record<string, { dark: string; medium: string; light: string }> = {
    brown: { dark: "#6B4423", medium: "#8B5A2B", light: "#A0765A" },
    black: { dark: "#0a0a0a", medium: "#1a1a1a", light: "#2d2d2d" },
    blonde: { dark: "#D4A017", medium: "#FFD700", light: "#FFE55C" },
    pink: { dark: "#FF1493", medium: "#FF69B4", light: "#FFB6C1" },
    blue: { dark: "#1E90FF", medium: "#4169E1", light: "#87CEEB" },
    purple: { dark: "#8B008B", medium: "#9370DB", light: "#DDA0DD" },
    green: { dark: "#228B22", medium: "#32CD32", light: "#90EE90" },
    red: { dark: "#8B0000", medium: "#DC143C", light: "#FF6B6B" }
  };

  const eyeColors: Record<string, string> = {
    brown_eyes: "#6B4423",
    blue_eyes: "#4169E1",
    green_eyes: "#228B22",
    gray_eyes: "#808080",
    hazel_eyes: "#8B7355",
    violet_eyes: "#8B008B"
  };

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("hair_color, hairstyle, eye_color, top, bottom, accessory, coins")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        console.log("PixelAvatar - Loading profile:", profile);
        setHairColor(profile.hair_color || "brown");
        setHairstyle(profile.hairstyle || "long");
        setEyeColor(profile.eye_color || "brown_eyes");
        setTop(profile.top || "basic_shirt");
        setBottom(profile.bottom || "basic_pants");
        setAccessory(profile.accessory || "none");
        setCoins(profile.coins || 0);
      }
    };

    loadProfile();

    const channel = supabase
      .channel('profile-updates-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles'
        },
        (payload) => {
          console.log("PixelAvatar - Realtime update received:", payload);
          loadProfile();
        }
      )
      .subscribe((status) => {
        console.log("PixelAvatar - Subscription status:", status);
      });

    return () => { 
      console.log("PixelAvatar - Cleaning up channel");
      supabase.removeChannel(channel); 
    };
  }, []);

  const hair = hairColors[hairColor] || hairColors.brown;
  const eyes = eyeColors[eyeColor] || eyeColors.brown_eyes;
  const skin = { 
    base: "#FDBCB4", 
    shade: "#F4A69A", 
    light: "#FFD4CC", 
    dark: "#E89B8D",
    mid: "#FCAD9E"
  };

  // Base avatar grid - 64x96 with natural, human-like design
  const createBaseGrid = () => {
    const grid: number[] = [];
    
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        let value = 0;
        
        // === HAIRSTYLE RENDERING (natural, no protruding elements) ===
        if (hairstyle === 'long') {
          // Main hair volume - starts lower for natural look
          if (y >= 8 && y <= 22 && x >= 18 && x <= 45) {
            const distFromTop = y - 8;
            if (distFromTop <= 4) value = 1;
            else if (distFromTop <= 10) value = 2;
            else value = 3;
          }
          // Hair strands extending down naturally
          if (y >= 20 && y <= 38) {
            if (x >= 18 && x <= 22) value = 3;
            if (x >= 41 && x <= 45) value = 3;
          }
          // Natural bangs
          if (y >= 14 && y <= 18 && x >= 22 && x <= 41) {
            const bangsDist = Math.abs(x - 31.5) / 10;
            if (bangsDist < 0.6) value = 3;
            else if (bangsDist < 0.9) value = 2;
          }
        } else if (hairstyle === 'bob') {
          if (y >= 10 && y <= 30 && x >= 18 && x <= 45) {
            if (y <= 14) value = 1;
            else if (y <= 22) value = 2;
            else value = 3;
          }
          if (y >= 24 && y <= 30) {
            if (x >= 18 && x <= 22 || x >= 41 && x <= 45) value = 3;
          }
        } else if (hairstyle === 'ponytail') {
          // Main hair
          if (y >= 10 && y <= 22 && x >= 20 && x <= 43) {
            if (y <= 14) value = 1;
            else if (y <= 18) value = 2;
            else value = 3;
          }
          // Ponytail at back (natural position)
          if (y >= 18 && y <= 36 && x >= 46 && x <= 52) {
            value = 3;
            if (x === 46 || x === 52) value = 2;
          }
        } else if (hairstyle === 'pigtails') {
          // Center hair - natural top
          if (y >= 10 && y <= 20 && x >= 22 && x <= 41) {
            if (y <= 14) value = 1;
            else value = 2;
          }
          // Left pigtail - thicker, more natural
          if (y >= 18 && y <= 30 && x >= 14 && x <= 20) {
            value = 3;
            if (x === 14 || x === 20) value = 2;
          }
          // Right pigtail - thicker, more natural
          if (y >= 18 && y <= 30 && x >= 43 && x <= 49) {
            value = 3;
            if (x === 43 || x === 49) value = 2;
          }
        } else if (hairstyle === 'bun') {
          // Main hair - natural coverage
          if (y >= 10 && y <= 20 && x >= 20 && x <= 43) value = 2;
          // Bun positioned naturally on back of head (not on top)
          if (y >= 8 && y <= 16 && x >= 28 && x <= 35) {
            const bunCenterX = 31.5;
            const bunCenterY = 12;
            const bunDist = Math.sqrt(Math.pow(x - bunCenterX, 2) + Math.pow(y - bunCenterY, 2));
            if (bunDist <= 4) {
              if (bunDist <= 2.5) value = 1;
              else value = 2;
            }
          }
        } else if (hairstyle === 'pixie') {
          // Short pixie cut
          if (y >= 10 && y <= 18 && x >= 18 && x <= 45) {
            if (y <= 14) value = 1;
            else value = 2;
          }
          if (y >= 12 && y <= 16) {
            const textureFactor = (x + y * 2) % 7;
            if (textureFactor < 3 && value === 2) value = 3;
          }
        }
        
        // === FACE (natural, smooth, rounded) ===
        const faceCenterX = 31.5;
        const faceCenterY = 28;
        const faceRadiusX = 11;
        const faceRadiusY = 12;
        const distanceFromFaceCenter = Math.sqrt(
          Math.pow((x - faceCenterX) / faceRadiusX, 2) + 
          Math.pow((y - faceCenterY) / faceRadiusY, 2)
        );
        
        // Natural face shape with smooth transitions
        if (y >= 16 && y <= 40 && x >= 20 && x <= 43 && distanceFromFaceCenter <= 1.1) {
          value = 4;
          if (distanceFromFaceCenter > 0.95) value = 5;
          else if (distanceFromFaceCenter > 0.75) value = 13;
        }
        
        // Forehead highlight
        if (y >= 20 && y <= 24 && x >= 28 && x <= 35) {
          const highlightDist = Math.abs(x - 31.5) / 4 + Math.abs(y - 22) / 3;
          if (highlightDist < 1 && value === 4) value = 6;
        }
        
        // === EYES (smooth, rounder) ===
        if (y >= 26 && y <= 30) {
          // Left eye
          const leftEyeCenterX = 27.5;
          const leftEyeCenterY = 28;
          const leftEyeDist = Math.sqrt(Math.pow(x - leftEyeCenterX, 2) + Math.pow(y - leftEyeCenterY, 2));
          
          if (leftEyeDist <= 2.5) {
            if (leftEyeDist <= 1.8) value = 7;
            else value = 5;
          }
          
          // Right eye
          const rightEyeCenterX = 35.5;
          const rightEyeCenterY = 28;
          const rightEyeDist = Math.sqrt(Math.pow(x - rightEyeCenterX, 2) + Math.pow(y - rightEyeCenterY, 2));
          
          if (rightEyeDist <= 2.5) {
            if (rightEyeDist <= 1.8) value = 7;
            else value = 5;
          }
        }
        
        // Eye highlights
        if ((y === 27 && x === 28) || (y === 27 && x === 36)) value = 6;
        
        // === NOSE ===
        if (y >= 30 && y <= 31 && x >= 31 && x <= 32) value = 5;
        
        // === BLUSH ===
        if (y >= 30 && y <= 31 && (x >= 24 && x <= 25 || x >= 38 && x <= 39)) value = 8;
        
        // === MOUTH ===
        if (y === 33 && x >= 30 && x <= 33) value = 5;
        
        // === NECK (natural connection to body) ===
        if (y >= 38 && y <= 45 && x >= 27 && x <= 36) {
          value = 4;
          if (x === 27 || x === 36) value = 13;
        }
        
        // === TOPS ===
        const topStartY = 46;
        const topEndY = 66;
        
        if (top === 'basic_shirt' && y >= topStartY && y <= topEndY && x >= 18 && x <= 45) {
          value = 9;
          if (y >= topStartY && y <= topStartY + 2 && x >= 26 && x <= 37) value = 10;
          if (x === 18 || x === 45 || y === topEndY) value = 10;
        } else if (top === 'striped_tee' && y >= topStartY && y <= topEndY && x >= 18 && x <= 45) {
          if ((y - topStartY) % 4 < 2) value = 9; else value = 10;
          if (y >= topStartY && y <= topStartY + 1) value = 10;
        } else if (top === 'hoodie') {
          if (y >= topStartY && y <= topEndY && x >= 18 && x <= 45) {
            value = 9;
            if (y >= topStartY && y <= topStartY + 6 && x >= 24 && x <= 39) {
              if (y === topStartY || y === topStartY + 6) value = 10;
            }
            if (y >= topStartY + 2 && y <= topStartY + 4 && (x === 30 || x === 33)) value = 10;
          }
        } else if (top === 'tank' && y >= topStartY && y <= topEndY && x >= 24 && x <= 39) {
          value = 9;
          if (y >= topStartY && y <= topStartY + 8) {
            if (x >= 26 && x <= 27 || x >= 36 && x <= 37) value = 10;
          }
        } else if (top === 'sweater') {
          if (y >= topStartY && y <= topEndY + 2 && x >= 16 && x <= 47) {
            value = 9;
            if ((x + y) % 6 < 3) value = 10;
            if (y >= topEndY - 2 && (x - 16) % 2 === 0) value = 10;
          }
        } else if (top === 'crop' && y >= topStartY && y <= topStartY + 12 && x >= 20 && x <= 43) {
          value = 9;
          if (x === 20 || x === 43 || y === topStartY + 12) value = 10;
        } else if (top === 'overalls') {
          if (y >= topStartY && y <= topEndY && x >= 18 && x <= 45) {
            value = 9;
            if (y >= topStartY && y <= topStartY + 14) {
              if (x >= 25 && x <= 27) value = 10;
              if (x >= 36 && x <= 38) value = 10;
            }
            if ((y === topStartY + 2 || y === topStartY + 10) && (x === 26 || x === 37)) value = 6;
          }
        } else if (top === 'blazer' && y >= topStartY && y <= topEndY + 2 && x >= 18 && x <= 45) {
          value = 9;
          if (y >= topStartY + 4 && y <= topStartY + 14) {
            if (x >= 22 && x <= 24) value = 10;
            if (x >= 39 && x <= 41) value = 10;
          }
          if (x >= 31 && x <= 32 && (y - topStartY) % 6 === 0) value = 6;
        }
        
        // === ARMS ===
        if (top !== 'tank' && y >= 50 && y <= 64) {
          if (x >= 12 && x <= 16) {
            value = 9;
            if (x === 12) value = 10;
          }
          if (x >= 47 && x <= 51) {
            value = 9;
            if (x === 51) value = 10;
          }
        } else if (top === 'tank' && y >= 50 && y <= 64) {
          if (x >= 12 && x <= 16) value = 4;
          if (x >= 47 && x <= 51) value = 4;
        }
        
        // === BOTTOMS ===
        const bottomStartY = 68;
        
        if (bottom === 'basic_pants') {
          if (y >= bottomStartY && y <= 88) {
            if (x >= 22 && x <= 28) {
              value = 11;
              if (x === 22 || x === 28) value = 12;
            }
            if (x >= 35 && x <= 41) {
              value = 11;
              if (x === 35 || x === 41) value = 12;
            }
          }
          if (y === bottomStartY && x >= 18 && x <= 45) value = 12;
        } else if (bottom === 'jeans') {
          if (y >= bottomStartY && y <= 88) {
            if (x >= 22 && x <= 28) {
              value = 11;
              if (x === 24 || x === 22 || x === 28) value = 12;
            }
            if (x >= 35 && x <= 41) {
              value = 11;
              if (x === 37 || x === 35 || x === 41) value = 12;
            }
            if (y >= bottomStartY + 4 && y <= bottomStartY + 10) {
              if (x === 23 || x === 27 || x === 36 || x === 40) value = 12;
            }
          }
          if (y === bottomStartY && x >= 18 && x <= 45) value = 12;
        } else if (bottom === 'skirt') {
          if (y >= bottomStartY && y <= bottomStartY + 16 && x >= 20 && x <= 43) {
            value = 11;
            if ((x - 20) % 4 === 0) value = 12;
            if (y === bottomStartY + 16) value = 12;
          }
          if (y >= bottomStartY + 18 && y <= 88) {
            if (x >= 22 && x <= 28) value = 4;
            if (x >= 35 && x <= 41) value = 4;
          }
        } else if (bottom === 'shorts') {
          if (y >= bottomStartY && y <= bottomStartY + 12) {
            if (x >= 22 && x <= 28) {
              value = 11;
              if (x === 22 || x === 28 || y === bottomStartY + 12) value = 12;
            }
            if (x >= 35 && x <= 41) {
              value = 11;
              if (x === 35 || x === 41 || y === bottomStartY + 12) value = 12;
            }
          }
          if (y === bottomStartY && x >= 18 && x <= 45) value = 12;
          if (y >= bottomStartY + 14 && y <= 88) {
            if (x >= 22 && x <= 28) value = 4;
            if (x >= 35 && x <= 41) value = 4;
          }
        } else if (bottom === 'leggings') {
          if (y >= bottomStartY && y <= 88) {
            if (x >= 22 && x <= 28) value = 11;
            if (x >= 35 && x <= 41) value = 11;
          }
          if (y === bottomStartY && x >= 18 && x <= 45) value = 12;
        } else if (bottom === 'dress') {
          if (y >= bottomStartY && y <= bottomStartY + 20) {
            const width = 23 + Math.floor((y - bottomStartY) * 0.3);
            const centerX = 31;
            if (x >= centerX - width/2 && x <= centerX + width/2) {
              value = 11;
              if (y === bottomStartY + 20) value = 12;
              if (y === bottomStartY && x >= 22 && x <= 41) value = 12;
            }
          }
          if (y >= bottomStartY + 22 && y <= 88) {
            if (x >= 22 && x <= 28) value = 4;
            if (x >= 35 && x <= 41) value = 4;
          }
        }
        
        // === FEET ===
        if (y >= 90 && y <= 94) {
          if (x >= 20 && x <= 29) {
            value = 5;
            if (y === 90 || x === 20) value = 12;
          }
          if (x >= 34 && x <= 43) {
            value = 5;
            if (y === 90 || x === 43) value = 12;
          }
        }
        
        // === ACCESSORIES (natural, integrated designs - no protruding sticks) ===
        if (accessory === 'bow') {
          if (y >= 8 && y <= 14 && x >= 36 && x <= 46) {
            value = 20;
            if (x >= 40 && x <= 42 && y >= 10 && y <= 12) value = 10;
          }
        } else if (accessory === 'cat') {
          // Cat ear headband - sits naturally on head, no tall protruding ears
          if (y >= 10 && y <= 14 && x >= 20 && x <= 43) {
            value = 20;
          }
          // Small rounded cat ear shapes on headband
          if (y >= 8 && y <= 12 && ((x >= 24 && x <= 27) || (x >= 36 && x <= 39))) {
            value = 20;
          }
        } else if (accessory === 'bunny') {
          // Bunny ear headband - short ears integrated into headband, not tall sticks
          if (y >= 10 && y <= 14 && x >= 20 && x <= 43) {
            value = 20;
          }
          // Short bunny ears on headband
          if (y >= 8 && y <= 14 && ((x >= 25 && x <= 26) || (x >= 37 && x <= 38))) {
            value = 20;
          }
        } else if (accessory === 'flower') {
          if (y >= 10 && y <= 16 && x >= 18 && x <= 22) {
            value = 20;
            if (y >= 12 && y <= 14 && x >= 19 && x <= 21) value = 9;
          }
        } else if (accessory === 'star') {
          if (y >= 6 && y <= 12 && x >= 44 && x <= 50) {
            if ((Math.abs(x - 47) + Math.abs(y - 9)) <= 3) value = 20;
          }
        } else if (accessory === 'wings') {
          if (y >= 50 && y <= 70) {
            if (x >= 6 && x <= 10) {
              value = 20;
              if ((x + y) % 3 === 0) value = 0;
            }
            if (x >= 53 && x <= 57) {
              value = 20;
              if ((x + y) % 3 === 0) value = 0;
            }
          }
        } else if (accessory === 'halo') {
          if (y >= 4 && y <= 8 && x >= 26 && x <= 37) {
            if (y === 4 || y === 8 || x === 26 || x === 37) value = 20;
          }
        } else if (accessory === 'horns') {
          // Small horns integrated into hair - not tall protruding sticks
          if (y >= 8 && y <= 12) {
            if (x >= 20 && x <= 22) value = 20;
            if (x >= 41 && x <= 43) value = 20;
          }
        } else if (accessory === 'headphones') {
          if (y >= 20 && y <= 28) {
            if (x >= 14 && x <= 18) {
              value = 20;
              if (x >= 15 && x <= 17 && y >= 22 && y <= 26) value = 5;
            }
            if (x >= 45 && x <= 49) {
              value = 20;
              if (x >= 46 && x <= 48 && y >= 22 && y <= 26) value = 5;
            }
          }
          if (y >= 10 && y <= 12 && x >= 20 && x <= 43) value = 20;
        } else if (accessory === 'glasses') {
          if (y >= 26 && y <= 30) {
            if ((y === 26 || y === 30 || x === 24 || x === 29) && x >= 24 && x <= 29) {
              value = 20;
            }
            if ((y === 26 || y === 30 || x === 34 || x === 39) && x >= 34 && x <= 39) {
              value = 20;
            }
          }
          if (y === 28 && x >= 30 && x <= 33) value = 20;
          if (y === 28 && (x >= 21 && x <= 23 || x >= 40 && x <= 42)) value = 20;
        } else if (accessory === 'sunglasses') {
          if (y >= 25 && y <= 30 && x >= 23 && x <= 40) {
            if (x >= 24 && x <= 29) value = 20;
            if (x >= 34 && x <= 39) value = 20;
            if (y === 25 || y === 30) value = 12;
          }
          if (y >= 27 && y <= 28 && x >= 30 && x <= 33) value = 20;
        } else if (accessory === 'witch_hat') {
          if (y >= 4 && y <= 14 && x >= 20 && x <= 43) {
            if (y <= 10) {
              const width = (10 - y) * 3;
              if (x >= 31 - width && x <= 31 + width) {
                value = 20;
                if (y >= 8 && y <= 9 && x >= 30 && x <= 33) value = 9;
              }
            }
            if (y >= 11 && y <= 14) value = 20;
          }
        } else if (accessory === 'crown') {
          if (y >= 6 && y <= 12 && x >= 24 && x <= 39) {
            value = 20;
            if (y >= 6 && y <= 8 && ((x - 24) % 5 === 0)) value = 9;
            if (y === 10 && ((x - 26) % 4 === 0)) value = 7;
          }
        } else if (accessory === 'bandana') {
          if (y >= 12 && y <= 18 && x >= 20 && x <= 43) {
            value = 20;
            if (y >= 14 && y <= 16 && x >= 41 && x <= 46) value = 10;
            if ((x + y) % 4 < 2) value = 10;
          }
        }
        
        grid.push(value);
      }
    }
    return grid;
  };

  const grid = createBaseGrid();

  // Dynamic color mapping
  const topColors: Record<string, { base: string; shade: string }> = {
    basic_shirt: { base: "#4A90E2", shade: "#357ABD" },
    striped_tee: { base: "#FF6B6B", shade: "#D63031" },
    hoodie: { base: "#A569BD", shade: "#8E44AD" },
    tank: { base: "#58D68D", shade: "#27AE60" },
    sweater: { base: "#F39C12", shade: "#D68910" },
    crop: { base: "#FF69B4", shade: "#FF1493" },
    overalls: { base: "#5DADE2", shade: "#3498DB" },
    blazer: { base: "#2C3E50", shade: "#1C2833" }
  };

  const bottomColors: Record<string, { base: string; shade: string }> = {
    basic_pants: { base: "#2C5F2D", shade: "#1E4620" },
    jeans: { base: "#4682B4", shade: "#2F5F8F" },
    skirt: { base: "#FF69B4", shade: "#FF1493" },
    shorts: { base: "#3498DB", shade: "#2874A6" },
    leggings: { base: "#34495E", shade: "#2C3E50" },
    dress: { base: "#E91E63", shade: "#C2185B" }
  };

  const accessoryColors: Record<string, string> = {
    cat: "#FF8C00",
    bunny: "#FFB6C1",
    flower: "#FF69B4",
    bow: "#FF1493",
    star: "#FFD700",
    wings: "#E1BEE7",
    halo: "#FFD700",
    horns: "#8B0000",
    headphones: "#212121",
    glasses: "#8B4513",
    sunglasses: "#212121",
    witch_hat: "#6A1B9A",
    crown: "#FFD700",
    bandana: "#E53935"
  };

  const currentTop = topColors[top] || topColors.basic_shirt;
  const currentBottom = bottomColors[bottom] || bottomColors.basic_pants;
  const currentAccessory = accessoryColors[accessory] || "#FF8C00";

  const getColor = (value: number): string => {
    switch (value) {
      case 0: return "transparent";
      case 1: return hair.dark;
      case 2: return hair.medium;
      case 3: return hair.light;
      case 4: return skin.base;
      case 5: return skin.shade;
      case 6: return skin.light;
      case 7: return eyes;
      case 8: return "#FF9999";
      case 9: return currentTop.base;
      case 10: return currentTop.shade;
      case 11: return currentBottom.base;
      case 12: return currentBottom.shade;
      case 13: return skin.mid;
      case 20: return currentAccessory;
      default: return "transparent";
    }
  };

  return (
    <Card className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-yellow-50 to-blue-100 dark:from-green-900 dark:via-yellow-900 dark:to-blue-900 overflow-hidden relative border-4 border-amber-900/20">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(90deg, rgba(139,69,19,0.1) 1px, transparent 1px), linear-gradient(rgba(139,69,19,0.1) 1px, transparent 1px)`,
        backgroundSize: `${pixelSize * 2}px ${pixelSize * 2}px`
      }} />
      
      <div 
        className="relative z-10 shadow-2xl"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${gridWidth}, ${pixelSize}px)`,
          gap: 0,
          imageRendering: 'pixelated'
        }}
      >
        {grid.map((cell, index) => (
          <div
            key={index}
            style={{
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: getColor(cell)
            }}
          />
        ))}
      </div>
      
      {showCoins && size !== "small" && (
        <div className="mt-8 text-center relative z-10">
          <div 
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 dark:from-yellow-600 dark:via-amber-600 dark:to-orange-600 rounded-lg shadow-xl border-4 border-amber-900/30" 
            style={{ boxShadow: '0 4px 0 rgba(139, 69, 19, 0.3), 0 8px 12px rgba(0,0,0,0.2)' }}
          >
            <span className="text-3xl">🪙</span>
            <span className="text-2xl font-bold text-amber-900 dark:text-amber-100" style={{ fontFamily: 'monospace' }}>
              {coins}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
