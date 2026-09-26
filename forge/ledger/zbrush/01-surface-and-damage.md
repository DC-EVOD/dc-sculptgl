ZBRUSH — SURFACE, DAMAGE AND METAL STORYTELLING
===============================================
Sources: Hristian Shyne (the method), TriGon (the noise stack and edge work).

THE GOVERNING IDEA
  Hristian: break the surface "to suggest that this was handmade, not machine
  made." TriGon: a perfectly smooth plate "looks really 3D and fake."
  Everything below exists to destroy machine perfection on purpose.

WORK ON LAYERS, WITH A MORPH TARGET — non-negotiable
  Before every damage pass:
      Layer > new layer          so the whole pass has one intensity dial
      Store Morph Target         so you can brush the pass back off locally
  Then sculpt harder than you want it, and dial the layer down afterwards.
  TriGon states the reason: at low intensity you cannot see what you are
  doing, so you cannot judge coverage. Work visible, then tone down.
  Morph brush = selective undo. It is how you break up a pass that came out
  too even.
  Bake layers down when a pass is finished — live layers bloat the ZTL badly.

THE BRUSH ROSTER, AND WHAT EACH IS FOR
  Flatten        Hristian's main metal brush. High strength, with the metal 01
                 alpha. Breaks the surface into facets. He prefers it because
                 "it stops at some point — it doesn't go through the mesh."
                 CAUTION: very powerful, and it hits backfaces. Turn backface
                 masking on, or it wrecks the far side.
  hPolish        TriGon's equivalent. Flattens, cleans, and is the tool he
                 reaches for to break up noise that came out too uniform.
  Clay Buildup   Adds volume and texture. With alpha 18 on spray, RGB off,
                 ZAdd 2-3, it imitates hammered metal. With alpha 40/47 on
                 spray it makes fine dot detail.
  Slash          Hristian's favourite, "I use this brush for everything."
                 Low intensity, for edge damage and jagged separation lines.
  DamStandard    Scratches and cracks. Go over the same stroke holding Alt to
                 sharpen it and stop it reading blobby. With Transparent on
                 you can draw THROUGH an overlapping mesh.
  Trim Dynamic   Edge breakup alternative.
  Standard       With alpha 60 held on Alt, makes cracks. With directionality,
                 breaks up featureless noise.
  Blob           On spray, adds irregular lumps.
  Snake Hook     Pulls individual stitches loose (see 02).

THE NOISE STACK — TriGon's actual sequence
  Metal gets MULTIPLE noise passes at different scales, each on its own layer,
  each toned down, with hPolish breaking up each one afterwards.
    Pass 1  Surface Noise, applied at a LOW subdivision, strength very low.
            Reads as hammered dents.
    Pass 2  Surface Noise again, highest subdivision, strength lower still.
            "I barely want to see it."
    Pass 3  NoisePlug for a more interesting pattern. He auditions presets
            (wood, Perlin, "fenoi", flakes) and mixes with Basic Noise.
            Set it to UV rather than 3D — the noise stops tiling perfectly and
            "feels more natural." (Requires UVs; see below.)
    Pass 4  One very large noise applied at the LOWEST subdivision, ~0.2,
            purely to deform the plate so it reads as an old warped piece.

  Masking the noise so it isn't uniform:
      Mask By Smoothness / Peaks and Valleys, then paint the mask by hand with
      an alpha, then use the morph brush to take detail back out.
  If the mask comes out bad, HIDE the surrounding subtools first — a cleaner
  mesh gives a cleaner cavity/smoothness mask.

  Save noise settings you like. TriGon: "metal noise 1, metal noise 2" so you
  build a repeatable library instead of re-dialling every time.

EDGE WEAR — worth it only if you have the time
  Both TriGon and Hristian say this outright: in a time-boxed production you
  do edge damage in texture, not sculpt. Do it in the sculpt when the piece is
  personal or hero.
  Method: new layer, morph target, run Trim Dynamic (or any breakup brush)
  along the edge with symmetry ON and go FAST — do not be careful. Then turn
  symmetry OFF and do a pass to kill the mirrored look. Then zoom out, find
  the spots that read as obviously symmetrical, and morph them away.
  Don't bother with interior edges you never see.

THE SYMMETRY LAW — stated by both, independently
  Hristian: on a symmetrical centre piece "it's a good practice to break the
  symmetry at some point because it will look weird."
  TriGon does the same on the edge-damage pass.
  (Abe Leal's Blender sources state the sharper version of this rule: the
  closer a detail is to the centre line, the more asymmetry it needs, because
  you can never see both far sides at once. Same law, better stated.)

BAKE-FORWARD THINKING — Hristian's most valuable habit
  He designs the high poly so the BAKE catches it:
    - Break up the junction where the edge trim meets the plate. That
      separation "can be used with the texturing to put some dirt, some
      ambient occlusion there to make everything pop."
    - Depth and cracks get caught by the curvature bake.
    - Give the plate, ornaments, edges and bolts DIFFERENT POLYGROUP COLOUR
      IDs — he used three or four — so Substance can split materials cleanly.
      He made one metal shinier than the other and darkened around the gold;
      that separation is only possible because the IDs exist.
    - Beware details that pop above the surface: they bake badly and make the
      ID mask sloppy.
  His lead's rule, quoted: "always think about how I will do the low poly of
  it" — is this one piece or several, how do you retopo the bolts, a couple of
  steps ahead.

BOLTS AND RIVETS
  Never sculpt a bolt out of the plate surface — the edge reads badly.
  Hristian: a half-sphere IMM brush. With drag-rect IMM, hold Ctrl and
  click-drag to place repeats at a LOCKED size instead of eyeballing.
  Check the IMM depth setting; they can end up hovering off the surface.
  Then: separate them, subdivide, Flatten to hammer them in, Clay Buildup
  around them, and chip/crack the surrounding metal so they read as forced in
  by a blacksmith in a hurry.
  TriGon's finishing touch: Standard brush on drag-rect, holding Alt, to DENT
  the plate underneath each rivet. "It just feels a little bit more grounded."
  Keep it subtle; put it on a layer.

CONTRAST / POLISH FINISHING
  Hristian uses Contrast Delta on spray to amplify existing detail (warns it
  may crash), combined with Smooth Peaks. Negative smooth adds crispness.
  Surface Noise can also be masked and inflated on a separate layer, then
  morph-brushed back to subtlety.
  Polish brushes clean the jagged edges Dynamesh leaves behind.

THE ATTITUDE, WHICH IS ALSO TECHNIQUE
  TriGon, on detailing metal: "it's better to have something that doesn't make
  too much sense than to have nothing." And: don't be afraid to make details
  VISIBLE — timid detail is wasted work. Add information, then break up the
  repetition by hand. Pure stamped/sprayed detail with no hand sculpting
  "becomes very generic and quite boring looking."
