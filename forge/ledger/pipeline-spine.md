PIPELINE SPINE — STAGE ORDERING
===============================
Source: Stefan Vaskevich (learn3d.ai character + environment pages, and the
Stefan 3D AI YouTube channel). ONE AUTHOR — not three confirmations.

READ THIS AS STRUCTURE, NOT CRAFT. Both web pages are course sales pages.
They give the ORDER of stages and a handful of stated production rules. They
do NOT teach technique, and their per-module TOOLS lists are image logos that
did not survive text extraction, so the tools they recommend are not recorded
here. The YouTube video is a model-comparison benchmark with a sponsor
segment; it teaches no armour technique at all.

CHARACTER PIPELINE — stated stage order
  concept development (2D refs, split the character into parts, extra views)
  -> 3D model generation
  -> sculpting (fix artifacts, silhouette, anatomy, pose, separate parts)
  -> retopology & optimisation (silhouette preservation, deformation areas)
  -> UV unwrapping
  -> texture baking (high -> low)
  -> painting / texturing (base colour, roughness, metallic, emission)
  -> rigging + weights + a test animation pass
  -> export to engine (Unity AND Unreal Engine 5 — both named)

ENVIRONMENT PIPELINE — stated stage order
  idea & concepts: an ISOMETRIC MASTER REFERENCE of the whole location first,
    then break it down into per-asset references
  -> generation of 3D models: LOW-POLY-FIRST; build simple modular elements
     by hand when the generator can't deliver clean results
  -> optimisation & refinement: fix geometry, bake high->low
  -> materials: correct clashing palettes against the original reference; set
     up PBR roughness / metallic / normal; unify style across the library
  -> scene assembly EXTERIOR
  -> scene assembly INTERIOR
  -> export and setup in Unreal Engine 5

RULES IT STATES PLAINLY — these are the useful part
  "START FROM THE LARGEST SHAPES AND WORK DOWN TO THE SMALLEST PROPS."
     Exterior order given: mountains/terrain -> large structures and
     foundations -> modular buildings using symmetry -> trees and flora with
     alpha masks -> detail props at points of interest.
     Interior order: walls and floors -> furniture and structure -> small
     props and decoration.
  IF THE SCALE IS WRONG, FIX THE BIG SHAPES FIRST. Never compensate downstream.
  CUT MATERIAL COUNT from 60-80 down to roughly 20. A stated, checkable target.
  CHECK AGAINST THE ORIGINAL REFERENCE CONSTANTLY.
  50+ assets generated for one environment — i.e. a location is a KIT, not a
  model. Build the kit, reuse it across shots and levels.
  AI generation always introduces colour inconsistency; a palette-correction
  pass against the reference is a named, required stage, not an optional one.

WHERE THIS AGREES WITH THE CRAFT SOURCES
  Largest-to-smallest is the same instruction Gatz gives for a harness (block
  out the body before any piece) and TriGon gives for a plate (nail the
  primary form before any panel line). Ironbark's whole method is a modular
  kit reused across a level. The agreement is worth noting precisely because
  these authors are otherwise unrelated.

WHAT THIS SPINE DOES NOT REPLACE
  It is an ordering, not a method. The actual craft lives in zbrush/ and
  blender/. Do not let a stage list stand in for knowing how to do the stage.
