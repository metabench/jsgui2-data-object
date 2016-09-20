
var jsgui = require('jsgui2-essentials');
var Evented_Class = require('jsgui2-evented-class');
//var Data_Structures = require('./jsgui-data-structures');
var Data_Value = require('jsgui2-data-value');

var Constraint = require('./constraint');
var Fields_Collection = require('./fields-collection');
var Collection = require('jsgui2-collection');

var j = jsgui;
var Class = j.Class;
var each = j.each;
var is_array = j.is_array;
var is_dom_node = j.is_dom_node;
var is_ctrl = j.is_ctrl;
var extend = j.extend;
var get_truth_map_from_arr = j.get_truth_map_from_arr;
var get_map_from_arr = j.get_map_from_arr;
var arr_like_to_arr = j.arr_like_to_arr;
var tof = j.tof;
var is_defined = j.is_defined;
var stringify = j.stringify;
var functional_polymorphism = j.functional_polymorphism;
var fp = j.fp;
var arrayify = j.arrayify;
var mapify = j.mapify;
var are_equal = j.are_equal;
var get_item_sig = j.get_item_sig;
var get_a_sig = j.get_a_sig;
var set_vals = j.set_vals;
var truth = j.truth;
var trim_sig_brackets = j.trim_sig_brackets;
var ll_set = j.ll_set;
var ll_get = j.ll_get;
var input_processors = j.input_processors;
var iterate_ancestor_classes = j.iterate_ancestor_classes;
var is_arr_of_arrs = j.is_arr_of_arrs;
var is_arr_of_strs = j.is_arr_of_strs;
var is_arr_of_t = j.is_arr_of_t;
var clone = jsgui.clone;

var data_value_index = 0;
var data_value_abbreviation = 'val';

// do data objects get an ID when they are initialized.
jsgui.__data_id_method = 'init';

var obj_matches_constraint = Constraint.obj_matches_constraint;
var native_constructor_tof = jsgui.native_constructor_tof;

var value_as_field_constraint = Constraint.value_as_field_constraint;

//var Ordered_String_List = Data_Structures.Ordered_String_List;
var Ordered_String_List =require('jsgui2-ordered-string-list');

class Mini_Context{

    // Need quite a simple mechanism to get IDs for objects.

    // They will be typed objects/

    'constructor'(spec) {


        var map_typed_counts = {}
        var typed_id = function(str_type) {
            throw 'stop Mini_Context typed id';

            var res;
            if (!map_typed_counts[str_type]) {
                res = str_type + '_0';
                map_typed_counts[str_type] = 1;
            } else {
                res = str_type + '_' + map_typed_counts[str_type];
                map_typed_counts[str_type]++;
            }
            return res;
        }
        this.new_id = typed_id;
        //new_id
    }
    'make'(abstract_object) {
        if (abstract_object._abstract) {
            //var res = new
            // we need the constructor function.

            var constructor = abstract_object.constructor;
            //console.log('constructor ' + constructor);


            //throw 'stop';

            var aos = abstract_object._spec;

            // could use 'delete?'
            aos.abstract = null;
            //aos._abstract = null;
            aos.context = this;
            var res = new constructor(aos);
            return res;
        } else {
            throw 'Object must be abstract, having ._abstract == true'
        }
    }

};

var is_js_native = function(obj) {
    var t = tof(obj);
    return t == 'number' || t == 'string' || t == 'boolean' || t == 'array';
}

class Data_Object extends Evented_Class {
    'constructor'(spec) {

        this.__data_object = true;

        if (!spec) spec = {};
        // if it's abstract call the abstract_init.

        if (spec.abstract === true) {
            this._abstract = true;
            var tSpec = tof(spec);

            if (tSpec == 'function') {
                this._type_constructor = spec;
                // could possibly
                // but maybe want to keep this json-friendly.

                // the type constructor could be used in a collection.
                //  could be more leightweight than other things? specific constraint objects.
            }
            // Abstract controls won't be dealing with events for the moment.
            if (tSpec == 'object') {
                this._spec = spec;
                // could possibly
                // but maybe want to keep this json-friendly.

                // the type constructor could be used in a collection.
                //  could be more leightweight than other things? specific constraint objects.
            }

        } else {
            var that = this;
            this._initializing = true;

            var t_spec = tof(spec);
            //console.log('t_spec', t_spec);

            if (!this.__type) {
                this.__type = 'data_object';

            }

            this.__type_name = 'data_object';

            if (!this.hasOwnProperty('_')) {
                this._ = {};
            }

            if (t_spec == 'object') {
                // Normal initialization

                if (spec.context) {
                    //console.log('spec has context');

                    this.context = spec.context;
                }

                if (spec._id) {
                    this.__id = spec._id;
                }

                // want to see if we are using any of the spec items as fields.


            }
            if (t_spec == 'data_object') {
                // Initialization by Data_Object value (for the moment)

                // Not so sure about copying the id of another object.

                if (spec.context) this.context = spec.context;

                // then copy the values over from spec.

                var spec_keys = spec.keys();
                console.log('spec_keys', spec_keys);

                each(spec_keys, function (i, key) {


                    //that.set(key, spec.get(key));
                    that.set(key, spec.get(key));
                });
            }


            if (!is_defined(this.__id) && jsgui.__data_id_method == 'init') {

                if (this.context) {
                    //console.log('this.context ' + this.context);
                    //console.log('sfy this.context ' + stringify(this.context));
                    this.__id = this.context.new_id(this.__type_name || this.__type);
                    //console.log('DataObject new ID from context: ' + this.__id);

                    //this.context.map_objects[this.__id] = this;
                    // Not keeping a map of objects by id in the context.

                } else {

                }


            }

            var chained_fields = get_chained_fields(this.constructor);
            var chained_fields_list = chained_fields_to_fields_list(chained_fields);


            if (chained_fields_list.length > 0) {
                this.fc = new Fields_Collection({

                    // Fields collection has a context?

                    //
                    //'containing_object': this
                });

                //console.log('*** chained_fields_list ' + stringify(chained_fields_list));

                //this.fc.set(chained_fields);
                this.fc.set(chained_fields_list);

                var do_connect = this.using_fields_connection();
                if (do_connect) {

                    var arr_field_names = [], field_name;
                    each(chained_fields, function (i, field_info) {
                        //console.log('field_info ' + stringify(field_info));

                        field_name = field_info[1][0];
                        //console.log('field_name ' + field_name);
                        arr_field_names.push(field_name);
                    });

                    // just an array of fields.
                    //console.log('arr_field_names ' + stringify(arr_field_names));
                    this.connect_fields(arr_field_names);
                }
            }

            var chained_field_name;


            // If the spec is an object.

            if (t_spec == 'object') {

                each(spec, function (v, i) {


                    if (typeof that[i] === 'function') {
                        // connected by now!

                        // such as setting the fields...

                        //setTimeout(function() {
                        that[i](v);
                        //}, 0);


                    } else {


                        if (chained_fields_list.length > 0) {
                            var tcf, chained_field;

                            for (var c = 0, l = chained_fields_list.length; c < l; c++) {
                                chained_field = chained_fields_list[c];

                                //console.log('chained_field', chained_field);


                                tcf = tof(chained_field);

                                //console.log('tcf', tcf);

                                if (tcf == 'string') {
                                    chained_field_name = chained_field;
                                } else if (tcf == 'array') {
                                    chained_field_name = chained_field[0];
                                }


                                if (chained_field_name === i) {

                                    Data_Object.prototype.set.apply(that, [i, v]);
                                }
                            }


                        }

                    }
                });

                if (spec.constraint) that.constraint(spec.constraint);
                if (is_defined(spec.parent)) {
                    this.set('parent', spec.parent);
                }
            }

            if (this.context) {
                this.init_default_events();
            }

            this._initializing = false;
        }
        //console.log('end Data_Object init');
    }

    'init_default_events'() {


    }

    /*
     'data_def': fp(function(a, sig) {
     if (sig == '[o]') {
     // create the new data_def constraint.


     }
     }),
     */

    'keys'() {
        return Object.keys(this._);
    }

    'toJSON'() {
        var res = [];
        res.push('Data_Object(' + JSON.stringify(this._) + ')');
        return res.join('');
    }

    'toObject'() {
        // need to go through each of them...
        var res = {};

        //console.log('this._ ' + stringify(this._));

        each(this._, function (i, v) {
            if (v.toObject) {
                //console.log('tof v ' + tof(v));
                res[i] = v.toObject();
            } else {
                res[i] = v;
            }
        })

        return res;
        //return this._;
    }

    // using_fields_connection()
    //  will search up the object heirachy, to see if the Data_Objects fields need to be connected through the use of functions.
    //  that will make the fields easy to change by calling a function. Should make things much faster to access than when programming with Backbone.
    // then will connect the fields with connect_fields()

    'using_fields_connection'() {
        var res = false;
        iterate_ancestor_classes(this.constructor, function (a_class, stop) {
            if (is_defined(a_class._connect_fields)) {
                res = a_class._connect_fields;
                stop();
            }
        })
        return res;

    }

    'connect_fields'() {


        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);

        var that = this;
        //throw '8) stop';

        if (a.l == 1 && tof(a[0]) == 'array') {
            //var arr_fields = a[0];
            each(a[0], function (i, v) {
                that.connect_fields(v);
            });
        }

        if (sig == '[s]') {


            this[a[0]] = function (a1) {
                //console.log('connected field function a[0]: ' + a[0]);

                if (typeof a1 == 'undefined') {
                    // 0 params
                    return that.get(a[0]);
                } else {
                    // 1 param

                    return that.set(a[0], a1);
                }
            };
        }

        if (sig == '[o]') {

            throw('16) stop');
        }

    }

    //'parent': fp(function(a, sig) {
    'parent'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);
        var obj, index;
        //console.log('parent sig', sig);

        // And _parent should be set automatically when the controls are put in place.

        if (a.l == 0) {
            //console.log('this._parent', this._parent);
            return this._parent;
        }
        if (a.l == 1) {
            obj = a[0];

            if (!this.context && obj.context) {
                this.context = obj.context;
            }

            var relate_by_id = function (that) {
                var obj_id = obj._id();
                that._relationships[obj_id] = true;
            }

            var relate_by_ref = function (that) {
                that._parent = obj;
            }
            relate_by_ref(this);
        }
        if (a.l == 2) {
            obj = a[0];
            index = a[1];

            if (!this.context && obj.context) {
                this.context = obj.context;
            }

            this._parent = obj;
            this._index = index;
        }

        if (is_defined(index)) {
            // I think we just set the __index property.
            //  I think a __parent property and a __index property would do the job here.
            //  Suits DOM heirachy.
            // A __relationships property could make sense for wider things, however, it would be easy (for the moment?)
            // to just have .__parent and .__index
            //


            // Not sure all Data_Objects will need contexts.
            //  It's mainly useful for Controls so far


        } else {
            // get the object's id...

            // setting the parent... the parent may have a context.


        }
    }

    '_id'() {
        // gets the id.
        //console.log('Data_Object _id this.context ' + this.context);

        // Should get the context at an early stage if possible.
        //  Need to have it as the item is added, I think.
        if (this.__id) return this.__id;

        if (this.context) {

            this.__id = this.context.new_id(this.__type_name || this.__type);

        } else {
            if (this._abstract) {
                return undefined;
            } else if (!is_defined(this.__id)) {

                // What does not have the abstract?

                //var stack = new Error().stack;
                //console.log(stack);

                // no such function... but there should be something declared in many situations.

                throw 'stop, currently unsupported.';
                this.__id = new_data_object_id();

                console.log('!!! no context __id ' + this.__id);
            }
        }
        return this.__id;
    }


    // Problems with name (fields).
    //  Fields are given as a description of the fields.
    //   Gets more complicated when we have a function to access the fields as well.
    //   What if we want to override that function?

    // Will call it field

    'field'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);
        var that = this;

        if (a.l == 0) {


            var fields_collection = this.fc;
            //console.log('fields_collection ' + fields_collection);

            // not just the field values.
            var res;

            // So has it been given the values?


            if (fields_collection) {
                res = fields_collection.okvs.values();
            } else {
                res = [];
            }

            return res;

        }

        if (sig == '[s]') {


            var fc = this.fc = this.fc || new Fields_Collection();


            //var fc = this.fc || this.fc = new Fields_Collection();
            //console.log('** fc ' + fc);


            var res = fc.get(a[0]);
            //console.log('res ' + stringify(res));
            return res;

        }

        //var that = this;
        if (sig == '[o]') {

            each(a[0], function (i, v) {
                //console.log('i ' + stringify(i));
                //console.log('v ' + stringify(v));

                // it's using the new set_field in Collection.
                that.set_field(i, v);

            }, that);
        }

    }

    'constraints'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);


        if (a.l == 0) {

            // want to get all the constraints.


        }

        if (sig == '[o]') {
            // setting the field constraints.

            // May have a closer look at those objects.

            // overwrite existing ones.
            var field_constraints = a[0];
            this._field_constraints = field_constraints;
        }


        if (a.l == 2 && tof(a[0]) == 'string') {


        }
    }

    'matches_field_constraint'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);

        if (sig == '[s,s]') {
            var field_name = a[0];

            // the constraint as just one item.
            //  there could be multiple fields constraints for that item.

            if (tof(a[1]) == 'string') {
                var str_constraint = a[1];

                // then use the constraint module to test these.

                var field_val = this.get(field_name);
                return obj_matches_constraint(field_val, str_constraint);
            }

            if (tof(a[1]) == 'array') {
                throw 'Multiple constraints not yet implemented here';
            }


        }
    }


    'obj_matches_field_constraints'(obj) {
        //console.log('matches_field_constraints ');
        var that = this;
        // iterate through the field constraints
        var matches = true;

        each(this._field_constraints, function (v, i) {
            // does it match?

            matches = matches && obj.matches_field_constraint(i, v)

        })
        return matches;
        //throw('stop');

    }

    // Can set prototype methods

    'set_field'() {
        this.fc = this.fc || new Fields_Collection();
        return this.fc.set.apply(this.fc, arguments);
    }


    'set_field_data_type_constraint'(field_name, data_type_constructor) {
        // these dtcs are separate to the fields themselves.

        // May be better using the Field_Collection here.

        var fmc = this._map_field_constraints = this._map_field_constraints || {};
        var fmfc = fmc[field_name];
        if (fmfc) {
            var deletion_index;
            each(fmfc, function (i, v) {
                // if it is a Field_Data_Type_Constraint
                if (v instanceof Constraint.Field_Data_Type) {
                    //return v;
                    //
                    if (v.data_type_constructor === data_type_constructor) {

                    } else {
                        // replace that one.
                        deletion_index = i;
                    }
                }
            })

            if (is_defined(deletion_index)) {
                fmfc.splice(deletion_index, 1);

                // create the new constraint object.
            }
        }
    }

    'get_field_data_type_constraint'(field_name) {
        var fmc = this._map_field_constraints;
        // field_constraints - they are constraints that apply to the fields. They are not the list of fields.
        var result = undefined;
        //
        if (fmc) {
            var fmfc = fmc[field_name];
            if (fmfc) {
                each(fmfc, function (i, v) {
                    // if it is a Field_Data_Type_Constraint
                    if (v instanceof Constraint.Field_Data_Type) {
                        result = v;
                        return v;
                    }
                });
            }
        }
        return result;
    }


    'ensure_field_constraint'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);

        if (sig == '[s,o]') {
            var field_name = a[0];
            var field_info = a[1];


            this._map_field_constraints = this._map_field_constraints || {};
            this._map_field_constraints[field_name] = this._map_field_constraints[field_name] || [];

            var fc_item_arr = this._map_field_constraints[field_name];

            var dt_info = field_info.data_type;

            var new_dt_constraint = Constraint.from_obj(dt_info);
            //console.log('new_dt_constraint ' + stringify(new_dt_constraint));

            if (!is_defined(new_dt_constraint)) {
                //throw '9) New constraint from_obj not profucing constraint';
            } else {


                var dt_constraint;
                //console.log('fc_item_arr ' + stringify(fc_item_arr));
                if (fc_item_arr.length > 0) {
                    // go through the array updating relevant constraints.
                    // really looking for the data_type constraint.

                    var dt_constraints = [];
                    //console.log('fc_item_arr ' + stringify(fc_item_arr));
                    // should only be one in there at maximum
                    each(fc_item_arr, function (i, constraint_item) {
                        //console.log('constraint_item ' + stringify(constraint_item));

                        if (constraint_item instanceof Constraint.Field_Data_Type) {
                            //console.log('constraint_item ' + stringify(constraint_item));

                            var constraint_info = constraint_item.to_info_obj();
                            //console.log('constraint_info ' + stringify(constraint_info));
                            //console.log('field_info ' + stringify(field_info));

                            var stack = new Error().stack
                            //console.log( stack )

                            throw ('6) it is! stop, check to see if it is a Field_Data_Type_Constraint, use instanceOf')


                        }
                    })

                    // check existing constraint against values given. possibly change it, possibly replace it.
                } else {

                    fc_item_arr.push(new_dt_constraint);
                }

            }
        }

    }

    'matches_field_constraints'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);
        if (a.l == 0) {
            return this.matches_field_constraints(this._field_constraints);
        }

        if (sig == '[D]') {
            // Does that Data_Object match the constraints of this one?

            var fcs = this._field_constraints;

            //console.log('fcs ' + stringify(fcs));

            var obj = a[0];

            var all_match = true, obj_field_value, matches;

            each(fcs, function (field_name, constraint) {
                // these constraints could potentially be something quite complicated and nested.

                // We would need to be careful about that.
                // Will use this for specifying HTML controls, being sure they are output in a standard format.

                obj_field_value = obj.get(field_name);
                //console.log('obj_field_value ' + obj_field_value);

                //console.log('constraint ' + constraint);

                matches = obj_matches_constraint(obj_field_value, constraint);

                all_match = all_match && matches;


            });

            // Will be faster to break out of each loop.

            return all_match;
        }


        if (sig == '[o]') {


            return data_object_matches_field_constraints(this, a[0]);

        }


    }

    'each'(callback) {
        // could use for i in...


        /*
         each(this._, function(i, v) {
         callback(i, v);
         });
         */

        // Could have inline code here for speed?
        each(this._, callback);


    }


    // could make this polymorphic so that it
    'position_within'(parent) {
        var p_id = parent._id();
        //console.log('p_id ' + p_id);
        //console.log('this._parents ' + stringify(this._parents));

        if (this._parents && is_defined(this._parents[p_id])) {
            var parent_rel_info = this._parents[p_id];
            //console.log('parent_rel_info ' + stringify(parent_rel_info));

            //var parents = this._parents;
            //if (parents) {
            //
            //}
            var pos_within = parent_rel_info[1];

            // It is indexed by position in parent through the parent.

            return pos_within;

        }


    }

    // Maybe just 'remove' function.
    //  This may be needed with multiple parents, which are not being used at the moment.

    'remove_from'(parent) {
        var p_id = parent._id();

        if (this._parents && is_defined(this._parents[p_id])) {

            var parent = this._parents[p_id][0];
            var pos_within = this._parents[p_id][1];

            // is the position within accurate?
            var item = parent._arr[pos_within];
            //console.log('item ' + stringify(item));


            //console.log('');
            //console.log('pos_within ' + pos_within);
            // Then remove the item in the collection (or Data_Object?) ....
            // and the actual parent?

            // can get control / dataobject / collection by its ID of course.

            parent.remove(pos_within);

            // Remove it by index.

            delete this._parents[p_id];


        }

    }


    'load_from_spec'(spec, arr_item_names) {
        var that = this;
        each(arr_item_names, function (i, v) {
            var spec_item = spec[v];
            if (is_defined(spec_item)) {
                that['set'](v, spec_item);
            }
        });
    }

    'value'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);
        // could operate like both get and set, but does not return data_objects, returns the value itself.
        var name;
        //var res;
        if (sig === '[s]') {
            name = a[0];
            var possibly_dobj = this.get(name);
            //var t_obj = tof(possibly_dobj);

            if (possibly_dobj) {
                if (possibly_dobj.value && typeof possibly_dobj.value === 'function') {
                    return possibly_dobj.value();
                } else {
                    return possibly_dobj;
                }
            }
        }
    }
    'get'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);
        var do_typed_processing = false;
        if (is_defined(this.__type_name) && this.__type_name !== 'data_object') do_typed_processing = true;
        if (do_typed_processing) {
            // should possibly have this assigned for controls...
            //var raw_input = a;
            //console.log('this.__type_name is defined: ' + this.__type_name);
            //var parsed_input_obj = jsgui.input_processors[this.__type_name](raw_input);
            if (a.l == 0) {
                var output_obj = jsgui.output_processors[this.__type_name](this._);
                return output_obj;
            } else {
                throw 'not yet implemented';
            }
        } else {

            if (sig == '[s,f]') {
                throw 'Asyncronous access not allowed on Data_Object get.'
                var res = this.get(a[0]);
                var callback = a[1];
                if (typeof res == 'function') {
                    res(callback);
                } else {
                    return res;
                }
                // could check if we had a function returned.
                //  then we execute that function
                //callback(null, res);
            }
            // check to see if there is a field defined.
            if (sig == '[s]') {
                //console.log('get param: ' + a[0]);
                var fc = this.fc;
                // let's have a look at the fields
                // Don't try to stringify field collections (yet).
                //console.log('fc.get() ' + stringify(fc.get()));
                var field_name = a[0];
                // could have .s in it, making it nested, and have removed nested from here.
                //console.log('pre fc get');
                var field;
                if (fc) {
                    field = fc.get(a[0]);
                }

                if (field_name.indexOf('.') > -1) {

                    var arr_field_names = field_name.split('.');

                    var level = 0, l = arr_field_names.length;
                    var current_obj = this, new_obj, fname;
                    while (level < l) {
                        fname = arr_field_names[level];
                        if (!current_obj) {
                            return undefined;
                        }

                        new_obj = current_obj.get(fname);

                        level++;
                        current_obj = new_obj;

                    }

                    return current_obj;
                }

                if (field) {
                    //console.log('tof(field) ' + tof(field));
                    //console.log('field ' + stringify(field));


                    if (!this._[field_name]) {

                        var sig_field = get_item_sig(field, 20);

                        if (sig_field == '[s,s,f]') {
                            var field_name = field[0];
                            var fieldStrType = field[1];
                            var fieldDef = field[2];


                            if (fieldDef === String) {
                                //console.log('is a String');
                                //throw 'stop';

                                var dval = new Data_Value({
                                    'context': this.context
                                })
                                this._[field_name] = dval;
                                return this._[field_name];


                            } else if (fieldDef === Number) {
                                //console.log('is a String');
                                //throw 'stop';

                                var dval = new Data_Value({
                                    'context': this.context
                                })
                                this._[field_name] = dval;
                                return this._[field_name];


                            } else if (fieldStrType === 'Class') {
                                // Can't create a new string like this...

                                //console.log('fieldDef', fieldDef);

                                var FieldConstructor = fieldDef;


                                var nObj = new FieldConstructor({
                                    'context': this.context
                                })
                                this._[field_name] = nObj;
                                return this._[field_name];

                            }


                        }

                        if (sig_field === '[s,[s,u]]') {
                            // it looks like it has gone wrong.
                            var stack = new Error().stack;
                            console.log(stack);
                        }

                        if (sig_field === '[s,s,o]') {
                            var field_name = field[0];
                            var field_type_name = field[1];
                            var field_info = field[2];


                            if (field_type_name === 'collection') {
                                //console.log('lazy loading - creating new collection');
                                this._[field_name] = new jsgui.Collection({
                                    'context': this.context
                                });
                                return this._[field_name];
                            } else {
                                // if it's just a string?

                                // 'data_object'
                                //  may get the data_type_object_constructor here.

                                if (field_type_name === 'data_object') {
                                    var dobj = new Data_Object({'context': this.context});
                                    this._[field_name] = dobj;
                                    dobj.parent(this);
                                    return this._[field_name];
                                }


                                if (field_type_name === 'ordered_string_list') {
                                    console.log('Ordered_String_List field_name', field_name);
                                    var osl = new Ordered_String_List();
                                    this._[field_name] = osl;
                                    return this._[field_name];
                                } else if (field_type_name == 'string') {
                                    // use a Data_Value?
                                    //throw 'stop';
                                    var dv = new Data_Value({
                                        'context': this.context
                                    });
                                    //dv.set()

                                    //console.log('dv.__id ' + dv.__id);
                                    //console.log('dv._id() ' + dv._id());
                                    //throw 'stop';
                                    this._[field_name] = dv;

                                    // not providing an index
                                    dv.parent(this);

                                    //console.log('dv ' + stringify(dv));

                                    return this._[field_name];
                                } else {


                                    var dt = field_info.data_type;
                                    var dt_sig = get_item_sig(dt, 4);
                                    //console.log('dt_sig ' + dt_sig);

                                    if (dt_sig == '[s,n]') {
                                        var data_type_name = dt[0];
                                        var data_type_length = dt[1];

                                        // then for text, just make a Data_Value

                                        if (data_type_name == 'text') {
                                            var dVal = new Data_Value({
                                                'context': this.context
                                            });
                                            //dVal.parent(this);
                                            //value.set(field_val);
                                            this._[field_name] = dVal;
                                            return this._[field_name];
                                        }

                                        // If the data type is just a string, need to process some specific
                                        //  data types.
                                        // This may be possible using input processors?


                                    } else if (dt_sig == 's') {
                                        var data_type_name = dt;
                                        //console.log('*** data_type_name ' + data_type_name);

                                        if (data_type_name == 'int') {
                                            var dVal = new Data_Value({
                                                'context': this.context
                                            });
                                            //dVal.parent(this);
                                            //value.set(field_val);
                                            this._[field_name] = dVal;
                                            return this._[field_name];
                                        }
                                        //if (data_type_name == '')
                                    } else {


                                        //var dtoc = this.mod_link().ensure_data_type_data_object_constructor(field_type_name);
                                        //console.log('dtoc ' + dtoc);
                                        // then use this to construct the empty field.

                                        //throw '!!stop';

                                        throw 'Need to use new object factory';

                                        var field_val = new dtoc({'context': this.context});
                                        field_val.parent(this);
                                        this._[field_name] = field_val;
                                        return this._[field_name];
                                    }
                                }

                            }

                        } else if (sig_field == '[s,s]') {
                            var field_name = field[0];
                            var field_type_name = field[1];

                            console.log('field_name ' + field_name);
                            console.log('field_type_name ' + field_type_name);

                            // perhaps getting collection fields should be moved to enhanced_data_object?
                            //  not keen on interdependencies here.


                            if (field_type_name == 'collection') {

                                // lazy creation of fields.

                                //throw 'not supported here. should use code in enhanced-data-object.';

                                // So, Collection has been added to jsgui by now.
                                console.log('pre make coll');

                                // Maybe Collection has not been added to jsgui.
                                //  Need to ensure it does get added when it's getting used.

                                // seems like the Collection object does not get put back on this...
                                //  or at least not always.

                                // looks like we use the module as it is.

                                var coll = new Collection({
                                    'context': this.context
                                });

                                console.log('pre set coll parent');
                                coll.parent(this);

                                this._[field_name] = coll;
                                return this._[field_name];

                            } else if (field_type_name == 'data_object') {
                                var dobj = new Data_Object({
                                    'context': this.context
                                })
                                dobj.parent(this);
                                this._[field_name] = dobj;
                                return this._[field_name];

                            } else if (field_type_name == 'string') {
                                var dval = new Data_Value({
                                    'context': this.context
                                })
                                this._[field_name] = dval;
                                return this._[field_name];

                            } else if (field_type_name == 'number') {
                                var dval = new Data_Value({
                                    'context': this.context
                                })
                                this._[field_name] = dval;
                                return this._[field_name];

                            } else {
                                var dtoc = jsgui.ensure_data_type_data_object_constructor(field_type_name);
                                //console.log('dtoc ' + dtoc);
                                //throw '!stop';
                                // then use this to construct the empty field.
                                //  without the new constructor it was trying to make an abstract version!!!
                                var obj = new dtoc({'context': this.context});
                                //if (this.context) obj.context = this.context;
                                obj.parent(this);

                                this._[field_name] = obj;
                                //console.log('this._ ' + stringify(this._));

                                return this._[field_name];
                            }
                        } else if (sig_field == '[s,[s,s]]') {
                            var field_name = field[0];
                            var field_info = field[1];

                            //console.log('field_info ' + stringify(field_info));

                            if (field_info[0] == 'collection') {
                                var collection_type_name = field_info[1];

                            }
                        } else if (sig_field == '[s,[s,o]]') {
                            // [fieldName,['collection', objDef]]

                            // eg field ["entries", ["collection", {"address": "string", "family": "string", "internal": "boolean"}]]
                            // it's a collection?? (check, with the particular data type)

                            var field_name = field[0];
                            var field_info = field[1];
                            var data_type_name = field_info[0];

                            if (data_type_name == 'collection') {
                                var objDef = field_info[1];
                                throw 'not supported here. should use code in enhanced-data-object.';

                            }

                        }


                    } else {
                        //console.log('did find field obj ' + field_name);

                        return this._[field_name];
                    }

                } else {
                    // Without a field... t

                    var res = ll_get(this._, a[0]);


                    if (!res) {
                        if (field_name.indexOf('.') > -1) {
                            throw 'not yet handled';
                        } else {
                            res = this[a[0]];
                        }
                    }

                    return res;
                }


            } else if (a.l == 0) {
                // need to get the values of all fields.
                //  Think they are now being held in the field collection, fc.

                return this._;
            }
        }


    }

    //'set': fp(function(a, sig) {
    'set'() {
        var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);

        if (this._abstract) return false;

        var that = this, res;

        var input_processors;
        if (this._module_jsgui) {
            input_processors = this._module_jsgui.input_processors;
        } else {
            input_processors = this._get_input_processors();
        }

        if (a.l == 2 || a.l == 3) {


            var property_name = a[0], value = a[1];

            var ta2 = tof(a[2]);
            //console.log('ta2', ta2);

            var silent = false;
            var source;

            if (ta2 == 'string' || ta2 == 'boolean') {
                silent = a[2]
            }

            if (ta2 == 'control') {
                source = a[2];
            }


            if (!this._initializing && this._map_read_only && this._map_read_only[property_name]) {
                throw 'Property "' + property_name + '" is read-only.';
            } else {
                var split_pn = property_name.split('.');

                if (split_pn.length > 1 && property_name != '.') {
                    //console.log('split_pn ' + stringify(split_pn));

                    var spn_first = split_pn[0];
                    var spn_arr_next = split_pn.slice(1);
                    var data_object_next = this.get(spn_first);
                    //console.log('data_object_next', data_object_next);
                    if (data_object_next) {

                        var res = data_object_next.set(spn_arr_next.join('.'), value);

                        if (!silent) {

                            var e_change = {
                                'name': property_name,
                                'value': value,
                                'bubbled': true
                            };
                            if (source) {
                                e_change.source = source;
                            }
                            this.raise_event('change', e_change);
                        }
                    } else {

                        throw('No data object at this level.');
                    }

                } else {


                    var data_object_next = this.get(property_name);

                    if (data_object_next) {

                        var field = this.field(property_name);
                        //console.log('field', field);
                        if (field) {

                            data_object_next.__type_name = field[1] || data_object_next.__type_name;
                        }
                        data_object_next.set(value);
                        //console.log('3) data_object_next', data_object_next);
                    }


                    if (!is_defined(data_object_next)) {
                        var tv = typeof value;
                        var dv;
                        //console.log('property_name', property_name);
                        //console.log('tv ' + tv);

                        // And for an array?


                        if (tv === 'string' || tv === 'number' || tv === 'boolean' || tv === 'date') {
                            dv = new Data_Value({'value': value});
                        } else {

                            // And could make an array into a collection.
                            //  That seems like the most logical internal way of doing things.
                            //  An option to have them as arrays would make sense for performance (or typed arrays),
                            //   but a Collection makes the most sense logically.

                            if (tv === 'array') {
                                dv = new Data_Value({'value': value});
                            } else {

                                if (tv === 'object') {

                                    if (value.__data_object || value.__data_value || value.__data_grid) {
                                        dv = value;
                                    } else {
                                        dv = new Data_Value({'value': value});
                                    }


                                } else {

                                    //console.log('tv', tv);


                                    dv = value;
                                }
                                //dv = value;
                            }
                        }
                        this._[property_name] = dv;

                        if (!silent) {
                            var e_change = {
                                'name': property_name,
                                'value': dv
                            }

                            if (source) {
                                e_change.source = source;
                            }

                            this.raise_event('change', e_change);
                        }
                        return value;

                    } else {
                        var next_is_js_native = is_js_native(data_object_next);
                        if (next_is_js_native) {
                            //console.log('is_js_native');
                            //this.set
                            // but maybe that object should be wrapped in Data_Object?
                            this._[property_name] = value;
                            res = value;


                        } else {
                            //console.log('not is_js_native');

                            //var res = data_object_next.set(value);
                            res = data_object_next
                            this._[property_name] = data_object_next;
                        }


                        if (!silent) {
                            var e_change = {
                                'name': property_name,
                                'value': data_object_next.value()
                            };
                            if (source) {
                                e_change.source = source;
                            }
                            this.trigger('change', e_change);
                        }
                        // want to listen to the set event for some things such as GUI components in particular.

                        return res;
                    }
                }
            }
        } else {
            // But maybe it should be a data_value, not a data_object.
            //console.log('3) else sig ' + sig);
            var value = a[0];
            var input_processor = input_processors[this.__type_name];

            if (input_processor) {

                // Act differently if it has a field as well?

                var processed_input = input_processor(value);
                //console.log('processed_input', processed_input);
                value = processed_input;
                this._[property_name] = value;

                this.raise_event('change', {
                    'value': value
                });
                return value;


            } else {
                // Need to be on the lookout for that.


                // And for a Data_Object?
                //  Basically put it into place.

                if (sig == '[D]') {
                    //console.log('property_name ' + property_name);
                    this._[property_name] = value;

                    // Or just have 3 parameters?

                    this.raise_event('change', [property_name, value]);

                    // Raise a change event?
                    //  Or is set event OK?
                    return value;
                }

                if (sig == '[o]') {
                    //console.log('setting with a provided object');

                    var that = this;
                    // may need to be recursive.
                    var res = {};
                    each(a[0], function (i, v) {
                        //console.log('i ' + i);
                        //console.log('v ' + stringify(v));

                        res[i] = that.set(i, v);
                        //that.raise_event('change', [i, v]);

                    });
                    return res;
                }

                // C for collection?
                if (sig == '[c]') {
                    //this._[]
                    this._[property_name] = value;
                    this.raise_event('change', [property_name, value]);
                    //throw 'unsupported';
                    return value;
                }
            }
        }
    }

    'has'(property_name) {
        return is_defined(this.get(property_name));
    }
}



Data_Object.prototype.read_only = arrayify(fp(function(a, sig) {
    var a = arguments; a.l = arguments.length; var sig = get_a_sig(a, 1);
    var mro = this._map_read_only = this._map_read_only || {};

    var field_name = a[0];

    if (sig == '[s]') {
        // a field name to make read-only
        mro[field_name] = true;
    }
    if (sig == '[s,b]') {
        // a field name to make read-only, boolean value can be false

        var bool_is_read_only = a[1];
        if (bool_is_read_only) {
            return this.read_only(field_name);
        } else {
            //delete mro[field_name];
            mro[field_name] = null;
        }
    }
    // array... process them?
    //  could arrayify the whole function.
}));

var get_fields_chain = function(data_object_class) {
    var res = [];
    var inner = function(data_object_class) {
        // _fields... fields will be given as an array by default, to preserve the order.

        var fields = data_object_class._fields;


        //console.log('get_fields_chain fields ' + stringify(fields));
        if (fields) {
            res.push(fields);
        }
        // Could be pushing an array containing an array that represents one field.

        var sc = data_object_class._superclass;
        //console.log('sc ' + sc);
        //if (sc) console.log('sc.constructor._fields ' + stringify(sc.constructor._fields));
        if (sc) {
            inner(sc);
        }
    };
    inner(data_object_class);
    //console.log('get_fields_chain res ' + stringify(res));
    return res;
}


// But the fields may have an order. It may be necessary to preserve that order.
//  The order of fields is not of great imporance usually. May be nice to have their order guaranteed to stay the same...
//   it may be that different JavaScript engines will do this anyway.

var get_chained_fields = (data_object_class) => {
    // would be nice to do this in a way that preserves the order.
    //  an array of fields may be better.

    // The fields chain... need to make sure that is getting the separate fields.
    var fc = get_fields_chain(data_object_class);



    var i = fc.length; //or 10

    //var res = {};
    var res = [];

    // Not so sure about doing this... is it breaking up a field into more than one field when it should not be?


    while(i--)
    {
        //...
        var item = fc[i];
        var c = 0;

        //console.log('item', item);
        // item is either an object or an array.

        each(item, function(field_info, i2) {

            //console.log('');
            //console.log('i2 ' + i2);

            if (tof(i2) == 'string') {
                c = c + 1;
                res.push([c, [i2, field_info]]);
            } else {
                res.push([i2, field_info]);
                c = i2;
            }

            //console.log('field_info ' + stringify(field_info));

            //res[i2] = v;
            // field_info could just be the field_name and some text. that should be fine.

        });

    }
    return res;
}

var chained_fields_to_fields_list = (chained_fields) => {

    var l = chained_fields.length;
    //console.log('l ' + l);
    var res = new Array(l);
    //var res_push = res.push;
    for (var c = 0; c < l; c++) {
        //res_push.call(res, chained_fields[c][1]);
        //res.push(chained_fields[c][1]);
        res[c] = chained_fields[c][1];
    };


    return res;
};

jsgui.map_classes = {};


var data_object_matches_field_constraints = (data_object, field_constraints) => {
    // Field constraints given as a normal object.

    // returns true or false
    //  though could return failure information as well if asked for it.
    //  making it into another polymorphic function.

    each(field_constraints, function(fc_name, fc_value) {
        //console.log('fc_name ' + fc_name);
        //console.log('fc_value ' + fc_value);

    });
};
// That data object will be indexable.

var Enhanced_Data_Object = null;

var set_Enhanced_Data_Object = function (EDO) {
    Enhanced_Data_Object = EDO;
};

var get_Enhanced_Data_Object = function () {
    return Enhanced_Data_Object;
};


// seems like an overlap with the new jsgui.fromObject function.
//  That will initially go in the Enhanced_Data_Object module, or jsgui-enh

var dobj = (obj, data_def) => {
    // could take a data_def?
    // Could use the enhanced data object if we patch backwards?
    //  So Enhanced_Data_Object could hopefully patch backwards in the code?

    //var tdd = tof(data_def);

    var cstr = Data_Object;
    if (Enhanced_Data_Object) cstr = Enhanced_Data_Object;
    //console.log('Enhanced_Data_Object ' + Enhanced_Data_Object);

    var res;
    if (data_def) {
        res = new cstr({'data_def': data_def});
    } else {
        res = new cstr({});
    }

    var tobj = tof(obj);

    //console.log('obj ' + stringify(obj));
    if (tobj == 'object') {
        var res_set = res.set;
        each(obj, function(v, i) {
            //res.set(i, v);
            res_set.call(res, i, v);
        });
    }

    return res;
};


var parse_field_text = Fields_Collection.parse_field_text;
var parse_data_type = Fields_Collection.parse_data_type;


input_processors.field_text = parse_field_text;
input_processors.data_type = parse_data_type;


Data_Object.Constraint = Constraint;

Data_Object.Fields_Collection = Fields_Collection;
Data_Object.dobj = dobj;
Data_Object.matches_field_constraints = data_object_matches_field_constraints;
Data_Object.parse_field_text = parse_field_text;
Data_Object.get_chained_fields = get_chained_fields;
Data_Object.chained_fields_to_fields_list = chained_fields_to_fields_list;
Data_Object.Mini_Context = Mini_Context;
Data_Object.set_Enhanced_Data_Object = set_Enhanced_Data_Object;
Data_Object.get_Enhanced_Data_Object = get_Enhanced_Data_Object;

module.exports = Data_Object;
