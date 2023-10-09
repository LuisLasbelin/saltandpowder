import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SaltAndPowderActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["saltandpowder", "sheet", "actor"],
      template: "systems/saltandpowder/templates/actor/actor-sheet.hbs",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  /** @override */
  get template() {
    return `systems/saltandpowder/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    console.log(actorData);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    for (let [k, v] of Object.entries(context.system.skills)) {
      v.label = game.i18n.localize(CONFIG.SAP.skills[k]) ?? k;
    }
    // Add dice images to each dice size
    for (const key in context.system.skills) {
      switch (context.system.skills[key].value) {
        case 4:
          context.system.skills[key].dice = 'icons/dice/d4black.svg'
          break;
        case 6:
          context.system.skills[key].dice = 'icons/dice/d6black.svg'
          break;
        case 8:
          context.system.skills[key].dice = 'icons/dice/d8black.svg'
          break;
        case 10:
          context.system.skills[key].dice = 'icons/dice/d10black.svg'
          break;
      }
    }

    // Create booleans for each wound
    for (const key in context.system.skills) {
      if (context.system.skills[key].wounds > 0) {
        context.system.skills[key].wound1 = true;
      }
      if (context.system.skills[key].wounds > 1) {
        context.system.skills[key].wound2 = true;
      }
      if (context.system.skills[key].wounds > 2) {
        context.system.skills[key].wound3 = true;
      }
    }

    // Create booleans for each stress
    if (context.system.stress.value > 0) {
      context.system.stress1 = true;
    }
    if (context.system.stress.value > 1) {
      context.system.stress2 = true;
    }
    if (context.system.stress.value > 2) {
      context.system.stress3 = true;
    }
    if (context.system.stress.value > 3) {
      context.system.stress4 = true;
    }
    if (context.system.stress.value > 4) {
      context.system.stress5 = true;
    }

    // Create booleans for each scar
    for (const key in context.system.skills) {
      if (context.system.skills[key].scars > 0) {
        context.system.skills[key].scar1 = true;
        if (context.system.skills[key].used_scars > 0) {
          context.system.skills[key].scar1_used = true;
        }
      }
      if (context.system.skills[key].scars > 1) {
        context.system.skills[key].scar2 = true;
        if (context.system.skills[key].used_scars > 1) {
          context.system.skills[key].scar2_used = true;
        }
      }
      if (context.system.skills[key].scars > 2) {
        context.system.skills[key].scar3 = true;
        if (context.system.skills[key].used_scars > 2) {
          context.system.skills[key].scar3_used = true;
        }
      }
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const weapons = []
    const skills = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to weapons
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to skills.
      else if (i.type === 'feature') {
        skills.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.weapons = weapons;
    context.skills = skills;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  _stress(event) {
    if (event.currentTarget.classList.contains('active') && this.actor.system.stress.value > 0) {
      this.actor.update({
        system: {
          stress:{
            value:this.actor.system.stress.value - 1
          } 
        }
      })
    } else if (this.actor.system.stress.value < 4) {
      this.actor.update({
        system: {
          stress:{
            value:this.actor.system.stress.value + 1
          } 
        }
      })
    }
  }

  _wound(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (event.currentTarget.classList.contains('active') && this.actor.system.skills[dataset.skill].wounds > 0) {
      this.actor.update({
        system: {
          skills: {
            [dataset.skill]: {
              wounds: this.actor.system.skills[dataset.skill].wounds - 1
            }
          }
        }
      })
    } else if (this.actor.system.skills[dataset.skill].wounds < 3) {
      this.actor.update({
        system: {
          skills: {
            [dataset.skill]: {
              wounds: this.actor.system.skills[dataset.skill].wounds + 1
            }
          }
        }
      })
    }
  }

  _scar(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (event.currentTarget.classList.contains('inactive') && this.actor.system.skills[dataset.skill].scars > 0) {
      this.actor.update({
        system: {
          skills: {
            [dataset.skill]: {
              scars: this.actor.system.skills[dataset.skill].scars - 1,
              used_scars: this.actor.system.skills[dataset.skill].scars - 1
            }
          }
        }
      })
    } else if (event.currentTarget.classList.contains('active')) {
      this.actor.update({
        system: {
          skills: {
            [dataset.skill]: {
              scars: this.actor.system.skills[dataset.skill].scars - 1,
              used_scars: this.actor.system.skills[dataset.skill].scars + 1
            }
          }
        }
      })
    }
    else if (this.actor.system.skills[dataset.skill].scars < 3) {
      this.actor.update({
        system: {
          skills: {
            [dataset.skill]: {
              scars: this.actor.system.skills[dataset.skill].scars + 1
            }
          }
        }
      })
    }

    console.log(event.currentTarget.classList)
  }

  _reduceDice(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.log(this.actor.system.skills)

    if (this.actor.system.skills[dataset.skill].value <= 4) return;
    this.actor.update({
      system: {
        skills: {
          [dataset.skill]: {
            value: this.actor.system.skills[dataset.skill].value - 2
          }
        }
      }
    })
  }

  _augmentDice(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.log(this.actor.system.skills)

    if (this.actor.system.skills[dataset.skill].value >= 10) return;
    this.actor.update({
      system: {
        skills: {
          [dataset.skill]: {
            value: this.actor.system.skills[dataset.skill].value + 2
          }
        }
      }
    })
  }

  _drink(event) {
    this._restoreSkills(event);
    if (this.actor.system.drunk.sick) {
      this.actor.update({
        system: {
          drunk: {
            drunk: true,
          }
        }
      })
    }
    if (this.actor.system.drunk.dizzy) {
      this.actor.update({
        system: {
          drunk: {
            sick: true,
          }
        }
      })
    }
    this.actor.update({
      system: {
        drunk: {
          dizzy: true,
        }
      }
    })

  }

  _rest(event) {
    this.actor.update({
      system: {
        drunk: {
          dizzy: false,
          sick: false,
          drunk: false
        }
      }
    })
  }

  _restoreSkills(event) {
    // Restore all non-wounded skills to their default values
    for (const key in this.actor.system.skills) {
      if (this.actor.system.skills[key].wounds <= 0) {
        this.actor.update({
          system: {
            skills: {
              [key]: {
                value: parseInt(this.actor.system.skills[key].max)
              }
            }
          }
        })
      }
    }
  }

  _editSkills(event) {
    if (this.actor.system.editingSkills) {
      this.actor.update({
        system: {
          editingSkills: false
        }
      })
    } else {
      this.actor.update({
        system: {
          editingSkills: true
        }
      })
    }
  }

  /* -------------------------------------------- */


  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Edit stats
    html.find('.wound').click(this._wound.bind(this));
    html.find('.scar').click(this._scar.bind(this));
    html.find('.stress').click(this._stress.bind(this));

    html.find('.btn-reduce').click(this._reduceDice.bind(this));
    html.find('.btn-augment').click(this._augmentDice.bind(this));
    html.find('.btn-drink').click(this._drink.bind(this));
    html.find('.btn-rest').click(this._rest.bind(this));
    html.find('.btn-editSkills').click(this._editSkills.bind(this));
    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
