
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\TitleBar.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file$8 = "src\\components\\TitleBar.svelte";

    function create_fragment$8(ctx) {
    	let div3;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let path1;
    	let t0;
    	let button1;
    	let svg1;
    	let path2;
    	let t1;
    	let div1;
    	let button2;
    	let t3;
    	let button3;
    	let t5;
    	let button4;
    	let t7;
    	let div2;
    	let button5;
    	let svg2;
    	let path3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t0 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path2 = svg_element("path");
    			t1 = space();
    			div1 = element("div");
    			button2 = element("button");
    			button2.textContent = "Students";
    			t3 = space();
    			button3 = element("button");
    			button3.textContent = "Instructors";
    			t5 = space();
    			button4 = element("button");
    			button4.textContent = "Logbook";
    			t7 = space();
    			div2 = element("div");
    			button5 = element("button");
    			svg2 = svg_element("svg");
    			path3 = svg_element("path");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "clip-rule", "evenodd");
    			attr_dev(path0, "d", "M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z");
    			add_location(path0, file$8, 40, 8, 963);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z");
    			add_location(path1, file$8, 45, 8, 1152);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "16");
    			attr_dev(svg0, "height", "16");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "class", "bi bi-x-lg svelte-hjgy15");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			add_location(svg0, file$8, 32, 6, 769);
    			attr_dev(button0, "class", "svelte-hjgy15");
    			add_location(button0, file$8, 31, 4, 727);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "clip-rule", "evenodd");
    			attr_dev(path2, "d", "M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z");
    			add_location(path2, file$8, 62, 8, 1634);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "16");
    			attr_dev(svg1, "height", "16");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "class", "bi bi-dash-lg svelte-hjgy15");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			add_location(svg1, file$8, 54, 6, 1437);
    			attr_dev(button1, "class", "svelte-hjgy15");
    			add_location(button1, file$8, 53, 4, 1395);
    			attr_dev(div0, "class", "button control svelte-hjgy15");
    			add_location(div0, file$8, 29, 2, 667);
    			attr_dev(button2, "id", "studentsTab");
    			attr_dev(button2, "class", "svelte-hjgy15");
    			toggle_class(button2, "active", /*tabIndex*/ ctx[0] === 0);
    			add_location(button2, file$8, 74, 4, 1933);
    			attr_dev(button3, "id", "instructorsTab");
    			attr_dev(button3, "class", "svelte-hjgy15");
    			toggle_class(button3, "active", /*tabIndex*/ ctx[0] === 1);
    			add_location(button3, file$8, 75, 4, 2036);
    			attr_dev(button4, "id", "logbookTab");
    			attr_dev(button4, "class", "svelte-hjgy15");
    			toggle_class(button4, "active", /*tabIndex*/ ctx[0] === 2);
    			add_location(button4, file$8, 76, 4, 2148);
    			attr_dev(div1, "class", "button tab svelte-hjgy15");
    			add_location(div1, file$8, 73, 2, 1903);
    			attr_dev(path3, "d", "M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z");
    			add_location(path3, file$8, 92, 8, 2635);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "16");
    			attr_dev(svg2, "height", "16");
    			attr_dev(svg2, "fill", "currentColor");
    			attr_dev(svg2, "class", "bi bi-fullscreen svelte-hjgy15");
    			attr_dev(svg2, "viewBox", "0 0 16 16");
    			add_location(svg2, file$8, 84, 6, 2435);
    			attr_dev(button5, "class", "svelte-hjgy15");
    			add_location(button5, file$8, 83, 4, 2393);
    			attr_dev(div2, "class", "button control svelte-hjgy15");
    			add_location(div2, file$8, 81, 2, 2329);
    			attr_dev(div3, "class", "titlebar svelte-hjgy15");
    			set_style(div3, "-webkit-app-region", "drag");
    			add_location(div3, file$8, 27, 0, 573);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(div0, t0);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path2);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, button2);
    			append_dev(div1, t3);
    			append_dev(div1, button3);
    			append_dev(div1, t5);
    			append_dev(div1, button4);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, button5);
    			append_dev(button5, svg2);
    			append_dev(svg2, path3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*shutdownPrompt*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*minimizeWindow*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*studentsTab*/ ctx[4], false, false, false),
    					listen_dev(button3, "click", /*instructorsTab*/ ctx[5], false, false, false),
    					listen_dev(button4, "click", /*logbookTab*/ ctx[6], false, false, false),
    					listen_dev(button5, "click", /*maximizeWindow*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tabIndex*/ 1) {
    				toggle_class(button2, "active", /*tabIndex*/ ctx[0] === 0);
    			}

    			if (dirty & /*tabIndex*/ 1) {
    				toggle_class(button3, "active", /*tabIndex*/ ctx[0] === 1);
    			}

    			if (dirty & /*tabIndex*/ 1) {
    				toggle_class(button4, "active", /*tabIndex*/ ctx[0] === 2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TitleBar', slots, []);
    	const { ipcRenderer } = require("electron");
    	let { tabIndex } = $$props;

    	function shutdownPrompt() {
    		ipcRenderer.send("shutdown-prompt");
    	}

    	function minimizeWindow() {
    		ipcRenderer.send("minimize-window");
    	}

    	function maximizeWindow() {
    		ipcRenderer.send("maximize-window");
    	}

    	function studentsTab() {
    		$$invalidate(0, tabIndex = 0);
    		console.log(tabIndex);
    	}

    	function instructorsTab() {
    		$$invalidate(0, tabIndex = 1);
    		console.log(tabIndex);
    	}

    	function logbookTab() {
    		$$invalidate(0, tabIndex = 2);
    		console.log(tabIndex);
    	}

    	const writable_props = ['tabIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<TitleBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    	};

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		tabIndex,
    		shutdownPrompt,
    		minimizeWindow,
    		maximizeWindow,
    		studentsTab,
    		instructorsTab,
    		logbookTab
    	});

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tabIndex,
    		shutdownPrompt,
    		minimizeWindow,
    		maximizeWindow,
    		studentsTab,
    		instructorsTab,
    		logbookTab
    	];
    }

    class TitleBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleBar",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabIndex*/ ctx[0] === undefined && !('tabIndex' in props)) {
    			console_1.warn("<TitleBar> was created without expected prop 'tabIndex'");
    		}
    	}

    	get tabIndex() {
    		throw new Error("<TitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
    		throw new Error("<TitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Containers\StudentsContainer.svelte generated by Svelte v3.44.0 */

    const file$7 = "src\\components\\Containers\\StudentsContainer.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(/*searchValue*/ ctx[0]);
    			add_location(p, file$7, 5, 2, 59);
    			attr_dev(div, "class", "svelte-15cnmpm");
    			add_location(div, file$7, 4, 0, 50);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchValue*/ 1) set_data_dev(t, /*searchValue*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StudentsContainer', slots, []);
    	let { searchValue } = $$props;
    	const writable_props = ['searchValue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StudentsContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    	};

    	$$self.$capture_state = () => ({ searchValue });

    	$$self.$inject_state = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchValue];
    }

    class StudentsContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentsContainer",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchValue*/ ctx[0] === undefined && !('searchValue' in props)) {
    			console.warn("<StudentsContainer> was created without expected prop 'searchValue'");
    		}
    	}

    	get searchValue() {
    		throw new Error("<StudentsContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchValue(value) {
    		throw new Error("<StudentsContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Containers\InstructorsContainer.svelte generated by Svelte v3.44.0 */

    const file$6 = "src\\components\\Containers\\InstructorsContainer.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let p2;
    	let t4;
    	let t5;
    	let p3;
    	let t6;
    	let t7;
    	let p4;
    	let t8;
    	let t9;
    	let p5;
    	let t10;
    	let t11;
    	let p6;
    	let t12;
    	let t13;
    	let p7;
    	let t14;
    	let t15;
    	let p8;
    	let t16;
    	let t17;
    	let p9;
    	let t18;
    	let t19;
    	let p10;
    	let t20;
    	let t21;
    	let p11;
    	let t22;
    	let t23;
    	let p12;
    	let t24;
    	let t25;
    	let p13;
    	let t26;
    	let t27;
    	let p14;
    	let t28;
    	let t29;
    	let p15;
    	let t30;
    	let t31;
    	let p16;
    	let t32;
    	let t33;
    	let p17;
    	let t34;
    	let t35;
    	let p18;
    	let t36;
    	let t37;
    	let p19;
    	let t38;
    	let t39;
    	let p20;
    	let t40;
    	let t41;
    	let p21;
    	let t42;
    	let t43;
    	let p22;
    	let t44;
    	let t45;
    	let p23;
    	let t46;
    	let t47;
    	let p24;
    	let t48;
    	let t49;
    	let p25;
    	let t50;
    	let t51;
    	let p26;
    	let t52;
    	let t53;
    	let p27;
    	let t54;
    	let t55;
    	let p28;
    	let t56;
    	let t57;
    	let p29;
    	let t58;
    	let t59;
    	let p30;
    	let t60;
    	let t61;
    	let p31;
    	let t62;
    	let t63;
    	let p32;
    	let t64;
    	let t65;
    	let p33;
    	let t66;
    	let t67;
    	let p34;
    	let t68;
    	let t69;
    	let p35;
    	let t70;
    	let t71;
    	let p36;
    	let t72;
    	let t73;
    	let p37;
    	let t74;
    	let t75;
    	let p38;
    	let t76;
    	let t77;
    	let p39;
    	let t78;
    	let t79;
    	let p40;
    	let t80;
    	let t81;
    	let p41;
    	let t82;
    	let t83;
    	let p42;
    	let t84;
    	let t85;
    	let p43;
    	let t86;
    	let t87;
    	let p44;
    	let t88;
    	let t89;
    	let p45;
    	let t90;
    	let t91;
    	let p46;
    	let t92;
    	let t93;
    	let p47;
    	let t94;
    	let t95;
    	let p48;
    	let t96;
    	let t97;
    	let p49;
    	let t98;
    	let t99;
    	let p50;
    	let t100;
    	let t101;
    	let p51;
    	let t102;
    	let t103;
    	let p52;
    	let t104;
    	let t105;
    	let p53;
    	let t106;
    	let t107;
    	let p54;
    	let t108;
    	let t109;
    	let p55;
    	let t110;
    	let t111;
    	let p56;
    	let t112;
    	let t113;
    	let p57;
    	let t114;
    	let t115;
    	let p58;
    	let t116;
    	let t117;
    	let p59;
    	let t118;
    	let t119;
    	let p60;
    	let t120;
    	let t121;
    	let p61;
    	let t122;
    	let t123;
    	let p62;
    	let t124;
    	let t125;
    	let p63;
    	let t126;
    	let t127;
    	let p64;
    	let t128;
    	let t129;
    	let p65;
    	let t130;
    	let t131;
    	let p66;
    	let t132;
    	let t133;
    	let p67;
    	let t134;
    	let t135;
    	let p68;
    	let t136;
    	let t137;
    	let p69;
    	let t138;
    	let t139;
    	let p70;
    	let t140;
    	let t141;
    	let p71;
    	let t142;
    	let t143;
    	let p72;
    	let t144;
    	let t145;
    	let p73;
    	let t146;
    	let t147;
    	let p74;
    	let t148;
    	let t149;
    	let p75;
    	let t150;
    	let t151;
    	let p76;
    	let t152;
    	let t153;
    	let p77;
    	let t154;
    	let t155;
    	let p78;
    	let t156;
    	let t157;
    	let p79;
    	let t158;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(/*searchValue*/ ctx[0]);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*searchValue*/ ctx[0]);
    			t3 = space();
    			p2 = element("p");
    			t4 = text(/*searchValue*/ ctx[0]);
    			t5 = space();
    			p3 = element("p");
    			t6 = text(/*searchValue*/ ctx[0]);
    			t7 = space();
    			p4 = element("p");
    			t8 = text(/*searchValue*/ ctx[0]);
    			t9 = space();
    			p5 = element("p");
    			t10 = text(/*searchValue*/ ctx[0]);
    			t11 = space();
    			p6 = element("p");
    			t12 = text(/*searchValue*/ ctx[0]);
    			t13 = space();
    			p7 = element("p");
    			t14 = text(/*searchValue*/ ctx[0]);
    			t15 = space();
    			p8 = element("p");
    			t16 = text(/*searchValue*/ ctx[0]);
    			t17 = space();
    			p9 = element("p");
    			t18 = text(/*searchValue*/ ctx[0]);
    			t19 = space();
    			p10 = element("p");
    			t20 = text(/*searchValue*/ ctx[0]);
    			t21 = space();
    			p11 = element("p");
    			t22 = text(/*searchValue*/ ctx[0]);
    			t23 = space();
    			p12 = element("p");
    			t24 = text(/*searchValue*/ ctx[0]);
    			t25 = space();
    			p13 = element("p");
    			t26 = text(/*searchValue*/ ctx[0]);
    			t27 = space();
    			p14 = element("p");
    			t28 = text(/*searchValue*/ ctx[0]);
    			t29 = space();
    			p15 = element("p");
    			t30 = text(/*searchValue*/ ctx[0]);
    			t31 = space();
    			p16 = element("p");
    			t32 = text(/*searchValue*/ ctx[0]);
    			t33 = space();
    			p17 = element("p");
    			t34 = text(/*searchValue*/ ctx[0]);
    			t35 = space();
    			p18 = element("p");
    			t36 = text(/*searchValue*/ ctx[0]);
    			t37 = space();
    			p19 = element("p");
    			t38 = text(/*searchValue*/ ctx[0]);
    			t39 = space();
    			p20 = element("p");
    			t40 = text(/*searchValue*/ ctx[0]);
    			t41 = space();
    			p21 = element("p");
    			t42 = text(/*searchValue*/ ctx[0]);
    			t43 = space();
    			p22 = element("p");
    			t44 = text(/*searchValue*/ ctx[0]);
    			t45 = space();
    			p23 = element("p");
    			t46 = text(/*searchValue*/ ctx[0]);
    			t47 = space();
    			p24 = element("p");
    			t48 = text(/*searchValue*/ ctx[0]);
    			t49 = space();
    			p25 = element("p");
    			t50 = text(/*searchValue*/ ctx[0]);
    			t51 = space();
    			p26 = element("p");
    			t52 = text(/*searchValue*/ ctx[0]);
    			t53 = space();
    			p27 = element("p");
    			t54 = text(/*searchValue*/ ctx[0]);
    			t55 = space();
    			p28 = element("p");
    			t56 = text(/*searchValue*/ ctx[0]);
    			t57 = space();
    			p29 = element("p");
    			t58 = text(/*searchValue*/ ctx[0]);
    			t59 = space();
    			p30 = element("p");
    			t60 = text(/*searchValue*/ ctx[0]);
    			t61 = space();
    			p31 = element("p");
    			t62 = text(/*searchValue*/ ctx[0]);
    			t63 = space();
    			p32 = element("p");
    			t64 = text(/*searchValue*/ ctx[0]);
    			t65 = space();
    			p33 = element("p");
    			t66 = text(/*searchValue*/ ctx[0]);
    			t67 = space();
    			p34 = element("p");
    			t68 = text(/*searchValue*/ ctx[0]);
    			t69 = space();
    			p35 = element("p");
    			t70 = text(/*searchValue*/ ctx[0]);
    			t71 = space();
    			p36 = element("p");
    			t72 = text(/*searchValue*/ ctx[0]);
    			t73 = space();
    			p37 = element("p");
    			t74 = text(/*searchValue*/ ctx[0]);
    			t75 = space();
    			p38 = element("p");
    			t76 = text(/*searchValue*/ ctx[0]);
    			t77 = space();
    			p39 = element("p");
    			t78 = text(/*searchValue*/ ctx[0]);
    			t79 = space();
    			p40 = element("p");
    			t80 = text(/*searchValue*/ ctx[0]);
    			t81 = space();
    			p41 = element("p");
    			t82 = text(/*searchValue*/ ctx[0]);
    			t83 = space();
    			p42 = element("p");
    			t84 = text(/*searchValue*/ ctx[0]);
    			t85 = space();
    			p43 = element("p");
    			t86 = text(/*searchValue*/ ctx[0]);
    			t87 = space();
    			p44 = element("p");
    			t88 = text(/*searchValue*/ ctx[0]);
    			t89 = space();
    			p45 = element("p");
    			t90 = text(/*searchValue*/ ctx[0]);
    			t91 = space();
    			p46 = element("p");
    			t92 = text(/*searchValue*/ ctx[0]);
    			t93 = space();
    			p47 = element("p");
    			t94 = text(/*searchValue*/ ctx[0]);
    			t95 = space();
    			p48 = element("p");
    			t96 = text(/*searchValue*/ ctx[0]);
    			t97 = space();
    			p49 = element("p");
    			t98 = text(/*searchValue*/ ctx[0]);
    			t99 = space();
    			p50 = element("p");
    			t100 = text(/*searchValue*/ ctx[0]);
    			t101 = space();
    			p51 = element("p");
    			t102 = text(/*searchValue*/ ctx[0]);
    			t103 = space();
    			p52 = element("p");
    			t104 = text(/*searchValue*/ ctx[0]);
    			t105 = space();
    			p53 = element("p");
    			t106 = text(/*searchValue*/ ctx[0]);
    			t107 = space();
    			p54 = element("p");
    			t108 = text(/*searchValue*/ ctx[0]);
    			t109 = space();
    			p55 = element("p");
    			t110 = text(/*searchValue*/ ctx[0]);
    			t111 = space();
    			p56 = element("p");
    			t112 = text(/*searchValue*/ ctx[0]);
    			t113 = space();
    			p57 = element("p");
    			t114 = text(/*searchValue*/ ctx[0]);
    			t115 = space();
    			p58 = element("p");
    			t116 = text(/*searchValue*/ ctx[0]);
    			t117 = space();
    			p59 = element("p");
    			t118 = text(/*searchValue*/ ctx[0]);
    			t119 = space();
    			p60 = element("p");
    			t120 = text(/*searchValue*/ ctx[0]);
    			t121 = space();
    			p61 = element("p");
    			t122 = text(/*searchValue*/ ctx[0]);
    			t123 = space();
    			p62 = element("p");
    			t124 = text(/*searchValue*/ ctx[0]);
    			t125 = space();
    			p63 = element("p");
    			t126 = text(/*searchValue*/ ctx[0]);
    			t127 = space();
    			p64 = element("p");
    			t128 = text(/*searchValue*/ ctx[0]);
    			t129 = space();
    			p65 = element("p");
    			t130 = text(/*searchValue*/ ctx[0]);
    			t131 = space();
    			p66 = element("p");
    			t132 = text(/*searchValue*/ ctx[0]);
    			t133 = space();
    			p67 = element("p");
    			t134 = text(/*searchValue*/ ctx[0]);
    			t135 = space();
    			p68 = element("p");
    			t136 = text(/*searchValue*/ ctx[0]);
    			t137 = space();
    			p69 = element("p");
    			t138 = text(/*searchValue*/ ctx[0]);
    			t139 = space();
    			p70 = element("p");
    			t140 = text(/*searchValue*/ ctx[0]);
    			t141 = space();
    			p71 = element("p");
    			t142 = text(/*searchValue*/ ctx[0]);
    			t143 = space();
    			p72 = element("p");
    			t144 = text(/*searchValue*/ ctx[0]);
    			t145 = space();
    			p73 = element("p");
    			t146 = text(/*searchValue*/ ctx[0]);
    			t147 = space();
    			p74 = element("p");
    			t148 = text(/*searchValue*/ ctx[0]);
    			t149 = space();
    			p75 = element("p");
    			t150 = text(/*searchValue*/ ctx[0]);
    			t151 = space();
    			p76 = element("p");
    			t152 = text(/*searchValue*/ ctx[0]);
    			t153 = space();
    			p77 = element("p");
    			t154 = text(/*searchValue*/ ctx[0]);
    			t155 = space();
    			p78 = element("p");
    			t156 = text(/*searchValue*/ ctx[0]);
    			t157 = space();
    			p79 = element("p");
    			t158 = text(/*searchValue*/ ctx[0]);
    			add_location(p0, file$6, 5, 2, 59);
    			add_location(p1, file$6, 6, 2, 83);
    			add_location(p2, file$6, 7, 2, 107);
    			add_location(p3, file$6, 8, 2, 131);
    			add_location(p4, file$6, 9, 2, 155);
    			add_location(p5, file$6, 9, 24, 177);
    			add_location(p6, file$6, 10, 2, 201);
    			add_location(p7, file$6, 11, 2, 225);
    			add_location(p8, file$6, 12, 2, 249);
    			add_location(p9, file$6, 13, 2, 273);
    			add_location(p10, file$6, 13, 24, 295);
    			add_location(p11, file$6, 14, 2, 319);
    			add_location(p12, file$6, 15, 2, 343);
    			add_location(p13, file$6, 16, 2, 367);
    			add_location(p14, file$6, 17, 2, 391);
    			add_location(p15, file$6, 17, 24, 413);
    			add_location(p16, file$6, 18, 2, 437);
    			add_location(p17, file$6, 19, 2, 461);
    			add_location(p18, file$6, 20, 2, 485);
    			add_location(p19, file$6, 21, 2, 509);
    			add_location(p20, file$6, 21, 24, 531);
    			add_location(p21, file$6, 22, 2, 555);
    			add_location(p22, file$6, 23, 2, 579);
    			add_location(p23, file$6, 24, 2, 603);
    			add_location(p24, file$6, 25, 2, 627);
    			add_location(p25, file$6, 25, 24, 649);
    			add_location(p26, file$6, 26, 2, 673);
    			add_location(p27, file$6, 27, 2, 697);
    			add_location(p28, file$6, 28, 2, 721);
    			add_location(p29, file$6, 29, 2, 745);
    			add_location(p30, file$6, 29, 24, 767);
    			add_location(p31, file$6, 30, 2, 791);
    			add_location(p32, file$6, 31, 2, 815);
    			add_location(p33, file$6, 32, 2, 839);
    			add_location(p34, file$6, 33, 2, 863);
    			add_location(p35, file$6, 33, 24, 885);
    			add_location(p36, file$6, 34, 2, 909);
    			add_location(p37, file$6, 35, 2, 933);
    			add_location(p38, file$6, 36, 2, 957);
    			add_location(p39, file$6, 37, 2, 981);
    			add_location(p40, file$6, 37, 24, 1003);
    			add_location(p41, file$6, 38, 2, 1027);
    			add_location(p42, file$6, 39, 2, 1051);
    			add_location(p43, file$6, 40, 2, 1075);
    			add_location(p44, file$6, 41, 2, 1099);
    			add_location(p45, file$6, 41, 24, 1121);
    			add_location(p46, file$6, 42, 2, 1145);
    			add_location(p47, file$6, 43, 2, 1169);
    			add_location(p48, file$6, 44, 2, 1193);
    			add_location(p49, file$6, 45, 2, 1217);
    			add_location(p50, file$6, 45, 24, 1239);
    			add_location(p51, file$6, 46, 2, 1263);
    			add_location(p52, file$6, 47, 2, 1287);
    			add_location(p53, file$6, 48, 2, 1311);
    			add_location(p54, file$6, 49, 2, 1335);
    			add_location(p55, file$6, 49, 24, 1357);
    			add_location(p56, file$6, 50, 2, 1381);
    			add_location(p57, file$6, 51, 2, 1405);
    			add_location(p58, file$6, 52, 2, 1429);
    			add_location(p59, file$6, 53, 2, 1453);
    			add_location(p60, file$6, 53, 24, 1475);
    			add_location(p61, file$6, 54, 2, 1499);
    			add_location(p62, file$6, 55, 2, 1523);
    			add_location(p63, file$6, 56, 2, 1547);
    			add_location(p64, file$6, 57, 2, 1571);
    			add_location(p65, file$6, 57, 24, 1593);
    			add_location(p66, file$6, 58, 2, 1617);
    			add_location(p67, file$6, 59, 2, 1641);
    			add_location(p68, file$6, 60, 2, 1665);
    			add_location(p69, file$6, 61, 2, 1689);
    			add_location(p70, file$6, 61, 24, 1711);
    			add_location(p71, file$6, 62, 2, 1735);
    			add_location(p72, file$6, 63, 2, 1759);
    			add_location(p73, file$6, 64, 2, 1783);
    			add_location(p74, file$6, 65, 2, 1807);
    			add_location(p75, file$6, 65, 24, 1829);
    			add_location(p76, file$6, 66, 2, 1853);
    			add_location(p77, file$6, 67, 2, 1877);
    			add_location(p78, file$6, 68, 2, 1901);
    			add_location(p79, file$6, 69, 2, 1925);
    			add_location(div, file$6, 4, 0, 50);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    			append_dev(div, t3);
    			append_dev(div, p2);
    			append_dev(p2, t4);
    			append_dev(div, t5);
    			append_dev(div, p3);
    			append_dev(p3, t6);
    			append_dev(div, t7);
    			append_dev(div, p4);
    			append_dev(p4, t8);
    			append_dev(div, t9);
    			append_dev(div, p5);
    			append_dev(p5, t10);
    			append_dev(div, t11);
    			append_dev(div, p6);
    			append_dev(p6, t12);
    			append_dev(div, t13);
    			append_dev(div, p7);
    			append_dev(p7, t14);
    			append_dev(div, t15);
    			append_dev(div, p8);
    			append_dev(p8, t16);
    			append_dev(div, t17);
    			append_dev(div, p9);
    			append_dev(p9, t18);
    			append_dev(div, t19);
    			append_dev(div, p10);
    			append_dev(p10, t20);
    			append_dev(div, t21);
    			append_dev(div, p11);
    			append_dev(p11, t22);
    			append_dev(div, t23);
    			append_dev(div, p12);
    			append_dev(p12, t24);
    			append_dev(div, t25);
    			append_dev(div, p13);
    			append_dev(p13, t26);
    			append_dev(div, t27);
    			append_dev(div, p14);
    			append_dev(p14, t28);
    			append_dev(div, t29);
    			append_dev(div, p15);
    			append_dev(p15, t30);
    			append_dev(div, t31);
    			append_dev(div, p16);
    			append_dev(p16, t32);
    			append_dev(div, t33);
    			append_dev(div, p17);
    			append_dev(p17, t34);
    			append_dev(div, t35);
    			append_dev(div, p18);
    			append_dev(p18, t36);
    			append_dev(div, t37);
    			append_dev(div, p19);
    			append_dev(p19, t38);
    			append_dev(div, t39);
    			append_dev(div, p20);
    			append_dev(p20, t40);
    			append_dev(div, t41);
    			append_dev(div, p21);
    			append_dev(p21, t42);
    			append_dev(div, t43);
    			append_dev(div, p22);
    			append_dev(p22, t44);
    			append_dev(div, t45);
    			append_dev(div, p23);
    			append_dev(p23, t46);
    			append_dev(div, t47);
    			append_dev(div, p24);
    			append_dev(p24, t48);
    			append_dev(div, t49);
    			append_dev(div, p25);
    			append_dev(p25, t50);
    			append_dev(div, t51);
    			append_dev(div, p26);
    			append_dev(p26, t52);
    			append_dev(div, t53);
    			append_dev(div, p27);
    			append_dev(p27, t54);
    			append_dev(div, t55);
    			append_dev(div, p28);
    			append_dev(p28, t56);
    			append_dev(div, t57);
    			append_dev(div, p29);
    			append_dev(p29, t58);
    			append_dev(div, t59);
    			append_dev(div, p30);
    			append_dev(p30, t60);
    			append_dev(div, t61);
    			append_dev(div, p31);
    			append_dev(p31, t62);
    			append_dev(div, t63);
    			append_dev(div, p32);
    			append_dev(p32, t64);
    			append_dev(div, t65);
    			append_dev(div, p33);
    			append_dev(p33, t66);
    			append_dev(div, t67);
    			append_dev(div, p34);
    			append_dev(p34, t68);
    			append_dev(div, t69);
    			append_dev(div, p35);
    			append_dev(p35, t70);
    			append_dev(div, t71);
    			append_dev(div, p36);
    			append_dev(p36, t72);
    			append_dev(div, t73);
    			append_dev(div, p37);
    			append_dev(p37, t74);
    			append_dev(div, t75);
    			append_dev(div, p38);
    			append_dev(p38, t76);
    			append_dev(div, t77);
    			append_dev(div, p39);
    			append_dev(p39, t78);
    			append_dev(div, t79);
    			append_dev(div, p40);
    			append_dev(p40, t80);
    			append_dev(div, t81);
    			append_dev(div, p41);
    			append_dev(p41, t82);
    			append_dev(div, t83);
    			append_dev(div, p42);
    			append_dev(p42, t84);
    			append_dev(div, t85);
    			append_dev(div, p43);
    			append_dev(p43, t86);
    			append_dev(div, t87);
    			append_dev(div, p44);
    			append_dev(p44, t88);
    			append_dev(div, t89);
    			append_dev(div, p45);
    			append_dev(p45, t90);
    			append_dev(div, t91);
    			append_dev(div, p46);
    			append_dev(p46, t92);
    			append_dev(div, t93);
    			append_dev(div, p47);
    			append_dev(p47, t94);
    			append_dev(div, t95);
    			append_dev(div, p48);
    			append_dev(p48, t96);
    			append_dev(div, t97);
    			append_dev(div, p49);
    			append_dev(p49, t98);
    			append_dev(div, t99);
    			append_dev(div, p50);
    			append_dev(p50, t100);
    			append_dev(div, t101);
    			append_dev(div, p51);
    			append_dev(p51, t102);
    			append_dev(div, t103);
    			append_dev(div, p52);
    			append_dev(p52, t104);
    			append_dev(div, t105);
    			append_dev(div, p53);
    			append_dev(p53, t106);
    			append_dev(div, t107);
    			append_dev(div, p54);
    			append_dev(p54, t108);
    			append_dev(div, t109);
    			append_dev(div, p55);
    			append_dev(p55, t110);
    			append_dev(div, t111);
    			append_dev(div, p56);
    			append_dev(p56, t112);
    			append_dev(div, t113);
    			append_dev(div, p57);
    			append_dev(p57, t114);
    			append_dev(div, t115);
    			append_dev(div, p58);
    			append_dev(p58, t116);
    			append_dev(div, t117);
    			append_dev(div, p59);
    			append_dev(p59, t118);
    			append_dev(div, t119);
    			append_dev(div, p60);
    			append_dev(p60, t120);
    			append_dev(div, t121);
    			append_dev(div, p61);
    			append_dev(p61, t122);
    			append_dev(div, t123);
    			append_dev(div, p62);
    			append_dev(p62, t124);
    			append_dev(div, t125);
    			append_dev(div, p63);
    			append_dev(p63, t126);
    			append_dev(div, t127);
    			append_dev(div, p64);
    			append_dev(p64, t128);
    			append_dev(div, t129);
    			append_dev(div, p65);
    			append_dev(p65, t130);
    			append_dev(div, t131);
    			append_dev(div, p66);
    			append_dev(p66, t132);
    			append_dev(div, t133);
    			append_dev(div, p67);
    			append_dev(p67, t134);
    			append_dev(div, t135);
    			append_dev(div, p68);
    			append_dev(p68, t136);
    			append_dev(div, t137);
    			append_dev(div, p69);
    			append_dev(p69, t138);
    			append_dev(div, t139);
    			append_dev(div, p70);
    			append_dev(p70, t140);
    			append_dev(div, t141);
    			append_dev(div, p71);
    			append_dev(p71, t142);
    			append_dev(div, t143);
    			append_dev(div, p72);
    			append_dev(p72, t144);
    			append_dev(div, t145);
    			append_dev(div, p73);
    			append_dev(p73, t146);
    			append_dev(div, t147);
    			append_dev(div, p74);
    			append_dev(p74, t148);
    			append_dev(div, t149);
    			append_dev(div, p75);
    			append_dev(p75, t150);
    			append_dev(div, t151);
    			append_dev(div, p76);
    			append_dev(p76, t152);
    			append_dev(div, t153);
    			append_dev(div, p77);
    			append_dev(p77, t154);
    			append_dev(div, t155);
    			append_dev(div, p78);
    			append_dev(p78, t156);
    			append_dev(div, t157);
    			append_dev(div, p79);
    			append_dev(p79, t158);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchValue*/ 1) set_data_dev(t0, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t2, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t4, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t6, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t8, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t10, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t12, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t14, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t16, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t18, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t20, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t22, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t24, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t26, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t28, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t30, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t32, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t34, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t36, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t38, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t40, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t42, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t44, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t46, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t48, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t50, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t52, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t54, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t56, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t58, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t60, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t62, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t64, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t66, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t68, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t70, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t72, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t74, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t76, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t78, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t80, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t82, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t84, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t86, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t88, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t90, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t92, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t94, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t96, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t98, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t100, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t102, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t104, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t106, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t108, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t110, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t112, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t114, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t116, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t118, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t120, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t122, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t124, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t126, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t128, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t130, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t132, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t134, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t136, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t138, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t140, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t142, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t144, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t146, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t148, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t150, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t152, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t154, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t156, /*searchValue*/ ctx[0]);
    			if (dirty & /*searchValue*/ 1) set_data_dev(t158, /*searchValue*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InstructorsContainer', slots, []);
    	let { searchValue } = $$props;
    	const writable_props = ['searchValue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InstructorsContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    	};

    	$$self.$capture_state = () => ({ searchValue });

    	$$self.$inject_state = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchValue];
    }

    class InstructorsContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InstructorsContainer",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchValue*/ ctx[0] === undefined && !('searchValue' in props)) {
    			console.warn("<InstructorsContainer> was created without expected prop 'searchValue'");
    		}
    	}

    	get searchValue() {
    		throw new Error("<InstructorsContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchValue(value) {
    		throw new Error("<InstructorsContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Containers\LogbookContainer.svelte generated by Svelte v3.44.0 */

    const file$5 = "src\\components\\Containers\\LogbookContainer.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-15cnmpm");
    			add_location(div, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LogbookContainer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LogbookContainer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class LogbookContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LogbookContainer",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\components\inferace\SearchBar.svelte generated by Svelte v3.44.0 */
    const file$4 = "src\\components\\inferace\\SearchBar.svelte";

    // (28:4) {:else}
    function create_else_block$1(ctx) {
    	let svg;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", "18");
    			attr_dev(line0, "y1", "6");
    			attr_dev(line0, "x2", "6");
    			attr_dev(line0, "y2", "18");
    			add_location(line0, file$4, 40, 8, 1102);
    			attr_dev(line1, "x1", "6");
    			attr_dev(line1, "y1", "6");
    			attr_dev(line1, "x2", "18");
    			attr_dev(line1, "y2", "18");
    			add_location(line1, file$4, 46, 8, 1212);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "delete svelte-kvb6um");
    			add_location(svg, file$4, 28, 6, 790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(28:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if searchValue == ""}
    function create_if_block$2(ctx) {
    	let svg;
    	let circle;
    	let line;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			line = svg_element("line");
    			attr_dev(circle, "cx", "11");
    			attr_dev(circle, "cy", "11");
    			attr_dev(circle, "r", "8");
    			add_location(circle, file$4, 24, 8, 655);
    			attr_dev(line, "x1", "21");
    			attr_dev(line, "y1", "21");
    			attr_dev(line, "x2", "16.65");
    			attr_dev(line, "y2", "16.65");
    			add_location(line, file$4, 25, 8, 704);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-search svelte-kvb6um");
    			add_location(svg, file$4, 13, 6, 334);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    			append_dev(svg, line);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(13:4) {#if searchValue == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let input;
    	let t;
    	let button;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*searchValue*/ ctx[0] == "") return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			button = element("button");
    			if_block.c();
    			attr_dev(input, "placeholder", "Search...");
    			attr_dev(input, "class", "svelte-kvb6um");
    			add_location(input, file$4, 10, 2, 205);
    			attr_dev(button, "class", "svelte-kvb6um");
    			add_location(button, file$4, 11, 2, 267);
    			attr_dev(div, "class", "svelte-kvb6um");
    			add_location(div, file$4, 9, 0, 153);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*searchValue*/ ctx[0]);
    			append_dev(div, t);
    			append_dev(div, button);
    			if_block.m(button, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    					listen_dev(button, "click", /*clearValue*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchValue*/ 1 && input.value !== /*searchValue*/ ctx[0]) {
    				set_input_value(input, /*searchValue*/ ctx[0]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -50, duration: 250 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -50, duration: 250 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SearchBar', slots, []);
    	let { searchValue } = $$props;

    	function clearValue() {
    		$$invalidate(0, searchValue = "");
    	}

    	const writable_props = ['searchValue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SearchBar> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchValue = this.value;
    		$$invalidate(0, searchValue);
    	}

    	$$self.$$set = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    	};

    	$$self.$capture_state = () => ({ fly, searchValue, clearValue });

    	$$self.$inject_state = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchValue, clearValue, input_input_handler];
    }

    class SearchBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchValue*/ ctx[0] === undefined && !('searchValue' in props)) {
    			console.warn("<SearchBar> was created without expected prop 'searchValue'");
    		}
    	}

    	get searchValue() {
    		throw new Error("<SearchBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchValue(value) {
    		throw new Error("<SearchBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\MainContainer.svelte generated by Svelte v3.44.0 */
    const file$3 = "src\\components\\MainContainer.svelte";

    // (11:2) {#if tabIndex === 0 || tabIndex === 1}
    function create_if_block_2(ctx) {
    	let searchbar;
    	let updating_searchValue;
    	let current;

    	function searchbar_searchValue_binding(value) {
    		/*searchbar_searchValue_binding*/ ctx[2](value);
    	}

    	let searchbar_props = {};

    	if (/*searchValue*/ ctx[1] !== void 0) {
    		searchbar_props.searchValue = /*searchValue*/ ctx[1];
    	}

    	searchbar = new SearchBar({ props: searchbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(searchbar, 'searchValue', searchbar_searchValue_binding));

    	const block = {
    		c: function create() {
    			create_component(searchbar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(searchbar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const searchbar_changes = {};

    			if (!updating_searchValue && dirty & /*searchValue*/ 2) {
    				updating_searchValue = true;
    				searchbar_changes.searchValue = /*searchValue*/ ctx[1];
    				add_flush_callback(() => updating_searchValue = false);
    			}

    			searchbar.$set(searchbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(searchbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(11:2) {#if tabIndex === 0 || tabIndex === 1}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {:else}
    function create_else_block(ctx) {
    	let logbookcontainer;
    	let current;
    	logbookcontainer = new LogbookContainer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(logbookcontainer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(logbookcontainer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logbookcontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logbookcontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logbookcontainer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(22:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:27) 
    function create_if_block_1$1(ctx) {
    	let div;
    	let instructorscontainer;
    	let current;

    	instructorscontainer = new InstructorsContainer({
    			props: { searchValue: /*searchValue*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(instructorscontainer.$$.fragment);
    			attr_dev(div, "class", "body svelte-b3fcfb");
    			add_location(div, file$3, 18, 4, 612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(instructorscontainer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const instructorscontainer_changes = {};
    			if (dirty & /*searchValue*/ 2) instructorscontainer_changes.searchValue = /*searchValue*/ ctx[1];
    			instructorscontainer.$set(instructorscontainer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(instructorscontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(instructorscontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(instructorscontainer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(18:27) ",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if tabIndex === 0}
    function create_if_block$1(ctx) {
    	let div;
    	let studentscontainer;
    	let current;

    	studentscontainer = new StudentsContainer({
    			props: { searchValue: /*searchValue*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(studentscontainer.$$.fragment);
    			attr_dev(div, "class", "body svelte-b3fcfb");
    			add_location(div, file$3, 14, 4, 504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(studentscontainer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const studentscontainer_changes = {};
    			if (dirty & /*searchValue*/ 2) studentscontainer_changes.searchValue = /*searchValue*/ ctx[1];
    			studentscontainer.$set(studentscontainer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(studentscontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(studentscontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(studentscontainer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:2) {#if tabIndex === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = (/*tabIndex*/ ctx[0] === 0 || /*tabIndex*/ ctx[0] === 1) && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block$1, create_if_block_1$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tabIndex*/ ctx[0] === 0) return 0;
    		if (/*tabIndex*/ ctx[0] === 1) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div, "class", "wrapper svelte-b3fcfb");
    			add_location(div, file$3, 9, 0, 366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*tabIndex*/ ctx[0] === 0 || /*tabIndex*/ ctx[0] === 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*tabIndex*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MainContainer', slots, []);
    	let { tabIndex } = $$props;
    	let searchValue = "";
    	const writable_props = ['tabIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MainContainer> was created with unknown prop '${key}'`);
    	});

    	function searchbar_searchValue_binding(value) {
    		searchValue = value;
    		$$invalidate(1, searchValue);
    	}

    	$$self.$$set = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    	};

    	$$self.$capture_state = () => ({
    		StudentsContainer,
    		InstructorsContainer,
    		LogbookContainer,
    		SearchBar,
    		tabIndex,
    		searchValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    		if ('searchValue' in $$props) $$invalidate(1, searchValue = $$props.searchValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tabIndex, searchValue, searchbar_searchValue_binding];
    }

    class MainContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainContainer",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabIndex*/ ctx[0] === undefined && !('tabIndex' in props)) {
    			console.warn("<MainContainer> was created without expected prop 'tabIndex'");
    		}
    	}

    	get tabIndex() {
    		throw new Error("<MainContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
    		throw new Error("<MainContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\inferace\AddButton.svelte generated by Svelte v3.44.0 */
    const file$2 = "src\\components\\inferace\\AddButton.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let svg;
    	let line0;
    	let line1;
    	let button_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", "12");
    			attr_dev(line0, "y1", "5");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "y2", "19");
    			add_location(line0, file$2, 10, 212, 435);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$2, 10, 256, 479);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "1");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-plus svelte-1hj4bbh");
    			add_location(svg, file$2, 10, 2, 225);
    			attr_dev(button, "class", "svelte-1hj4bbh");
    			add_location(button, file$2, 9, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addPress*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, true);
    				button_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, false);
    			button_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AddButton', slots, []);
    	let { addPressed } = $$props;

    	function addPress() {
    		$$invalidate(1, addPressed = !addPressed);
    	}

    	const writable_props = ['addPressed'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	$$self.$capture_state = () => ({ fade, addPressed, addPress });

    	$$self.$inject_state = $$props => {
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [addPress, addPressed];
    }

    class AddButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { addPressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddButton",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*addPressed*/ ctx[1] === undefined && !('addPressed' in props)) {
    			console.warn("<AddButton> was created without expected prop 'addPressed'");
    		}
    	}

    	get addPressed() {
    		throw new Error("<AddButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addPressed(value) {
    		throw new Error("<AddButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\AddScreen.svelte generated by Svelte v3.44.0 */
    const file$1 = "src\\components\\AddScreen.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-wfuzc8");
    			add_location(div, file$1, 9, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*addPress*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AddScreen', slots, []);
    	let { addPressed } = $$props;

    	function addPress() {
    		$$invalidate(1, addPressed = !addPressed);
    	}

    	const writable_props = ['addPressed'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	$$self.$capture_state = () => ({ fade, addPressed, addPress });

    	$$self.$inject_state = $$props => {
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [addPress, addPressed];
    }

    class AddScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { addPressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddScreen",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*addPressed*/ ctx[1] === undefined && !('addPressed' in props)) {
    			console.warn("<AddScreen> was created without expected prop 'addPressed'");
    		}
    	}

    	get addPressed() {
    		throw new Error("<AddScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addPressed(value) {
    		throw new Error("<AddScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.0 */
    const file = "src\\App.svelte";

    // (10:0) {#if addPressed}
    function create_if_block_1(ctx) {
    	let addscreen;
    	let updating_addPressed;
    	let current;

    	function addscreen_addPressed_binding(value) {
    		/*addscreen_addPressed_binding*/ ctx[2](value);
    	}

    	let addscreen_props = {};

    	if (/*addPressed*/ ctx[1] !== void 0) {
    		addscreen_props.addPressed = /*addPressed*/ ctx[1];
    	}

    	addscreen = new AddScreen({ props: addscreen_props, $$inline: true });
    	binding_callbacks.push(() => bind(addscreen, 'addPressed', addscreen_addPressed_binding));

    	const block = {
    		c: function create() {
    			create_component(addscreen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addscreen, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const addscreen_changes = {};

    			if (!updating_addPressed && dirty & /*addPressed*/ 2) {
    				updating_addPressed = true;
    				addscreen_changes.addPressed = /*addPressed*/ ctx[1];
    				add_flush_callback(() => updating_addPressed = false);
    			}

    			addscreen.$set(addscreen_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addscreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addscreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addscreen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(10:0) {#if addPressed}",
    		ctx
    	});

    	return block;
    }

    // (16:1) {#if tabIndex != 2}
    function create_if_block(ctx) {
    	let addbutton;
    	let updating_addPressed;
    	let current;

    	function addbutton_addPressed_binding(value) {
    		/*addbutton_addPressed_binding*/ ctx[4](value);
    	}

    	let addbutton_props = {};

    	if (/*addPressed*/ ctx[1] !== void 0) {
    		addbutton_props.addPressed = /*addPressed*/ ctx[1];
    	}

    	addbutton = new AddButton({ props: addbutton_props, $$inline: true });
    	binding_callbacks.push(() => bind(addbutton, 'addPressed', addbutton_addPressed_binding));

    	const block = {
    		c: function create() {
    			create_component(addbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const addbutton_changes = {};

    			if (!updating_addPressed && dirty & /*addPressed*/ 2) {
    				updating_addPressed = true;
    				addbutton_changes.addPressed = /*addPressed*/ ctx[1];
    				add_flush_callback(() => updating_addPressed = false);
    			}

    			addbutton.$set(addbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:1) {#if tabIndex != 2}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let main;
    	let titlebar;
    	let updating_tabIndex;
    	let t1;
    	let maincontainer;
    	let t2;
    	let current;
    	let if_block0 = /*addPressed*/ ctx[1] && create_if_block_1(ctx);

    	function titlebar_tabIndex_binding(value) {
    		/*titlebar_tabIndex_binding*/ ctx[3](value);
    	}

    	let titlebar_props = {};

    	if (/*tabIndex*/ ctx[0] !== void 0) {
    		titlebar_props.tabIndex = /*tabIndex*/ ctx[0];
    	}

    	titlebar = new TitleBar({ props: titlebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(titlebar, 'tabIndex', titlebar_tabIndex_binding));

    	maincontainer = new MainContainer({
    			props: { tabIndex: /*tabIndex*/ ctx[0] },
    			$$inline: true
    		});

    	let if_block1 = /*tabIndex*/ ctx[0] != 2 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			main = element("main");
    			create_component(titlebar.$$.fragment);
    			t1 = space();
    			create_component(maincontainer.$$.fragment);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-6en64f");
    			toggle_class(main, "blur", /*addPressed*/ ctx[1]);
    			add_location(main, file, 12, 0, 357);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(titlebar, main, null);
    			append_dev(main, t1);
    			mount_component(maincontainer, main, null);
    			append_dev(main, t2);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*addPressed*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*addPressed*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const titlebar_changes = {};

    			if (!updating_tabIndex && dirty & /*tabIndex*/ 1) {
    				updating_tabIndex = true;
    				titlebar_changes.tabIndex = /*tabIndex*/ ctx[0];
    				add_flush_callback(() => updating_tabIndex = false);
    			}

    			titlebar.$set(titlebar_changes);
    			const maincontainer_changes = {};
    			if (dirty & /*tabIndex*/ 1) maincontainer_changes.tabIndex = /*tabIndex*/ ctx[0];
    			maincontainer.$set(maincontainer_changes);

    			if (/*tabIndex*/ ctx[0] != 2) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*tabIndex*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*addPressed*/ 2) {
    				toggle_class(main, "blur", /*addPressed*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(maincontainer.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(maincontainer.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(titlebar);
    			destroy_component(maincontainer);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let tabIndex = 0;
    	let addPressed = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function addscreen_addPressed_binding(value) {
    		addPressed = value;
    		$$invalidate(1, addPressed);
    	}

    	function titlebar_tabIndex_binding(value) {
    		tabIndex = value;
    		$$invalidate(0, tabIndex);
    	}

    	function addbutton_addPressed_binding(value) {
    		addPressed = value;
    		$$invalidate(1, addPressed);
    	}

    	$$self.$capture_state = () => ({
    		TitleBar,
    		MainContainer,
    		AddButton,
    		AddScreen,
    		tabIndex,
    		addPressed
    	});

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tabIndex,
    		addPressed,
    		addscreen_addPressed_binding,
    		titlebar_tabIndex_binding,
    		addbutton_addPressed_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
