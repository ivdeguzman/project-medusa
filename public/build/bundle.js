
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
    function empty() {
        return text('');
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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

    /* src\components\TitleBar.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file$9 = "src\\components\\TitleBar.svelte";

    function create_fragment$9(ctx) {
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
    	let div3_transition;
    	let current;
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
    			add_location(path0, file$9, 41, 8, 1050);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z");
    			add_location(path1, file$9, 46, 8, 1239);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "16");
    			attr_dev(svg0, "height", "16");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "class", "bi bi-x-lg svelte-12n7rfi");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			add_location(svg0, file$9, 33, 6, 856);
    			attr_dev(button0, "class", "svelte-12n7rfi");
    			add_location(button0, file$9, 32, 4, 814);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "clip-rule", "evenodd");
    			attr_dev(path2, "d", "M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z");
    			add_location(path2, file$9, 63, 8, 1721);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "16");
    			attr_dev(svg1, "height", "16");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "class", "bi bi-dash-lg svelte-12n7rfi");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			add_location(svg1, file$9, 55, 6, 1524);
    			attr_dev(button1, "class", "svelte-12n7rfi");
    			add_location(button1, file$9, 54, 4, 1482);
    			attr_dev(div0, "class", "button control svelte-12n7rfi");
    			add_location(div0, file$9, 30, 2, 754);
    			attr_dev(button2, "id", "studentsTab");
    			attr_dev(button2, "class", "svelte-12n7rfi");
    			toggle_class(button2, "active", /*tabIndex*/ ctx[0] === 0);
    			add_location(button2, file$9, 75, 4, 2020);
    			attr_dev(button3, "id", "instructorsTab");
    			attr_dev(button3, "class", "svelte-12n7rfi");
    			toggle_class(button3, "active", /*tabIndex*/ ctx[0] === 1);
    			add_location(button3, file$9, 76, 4, 2123);
    			attr_dev(button4, "id", "logbookTab");
    			attr_dev(button4, "class", "svelte-12n7rfi");
    			toggle_class(button4, "active", /*tabIndex*/ ctx[0] === 2);
    			add_location(button4, file$9, 77, 4, 2235);
    			attr_dev(div1, "class", "button tab svelte-12n7rfi");
    			add_location(div1, file$9, 74, 2, 1990);
    			attr_dev(path3, "d", "M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z");
    			add_location(path3, file$9, 93, 8, 2722);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "16");
    			attr_dev(svg2, "height", "16");
    			attr_dev(svg2, "fill", "currentColor");
    			attr_dev(svg2, "class", "bi bi-fullscreen svelte-12n7rfi");
    			attr_dev(svg2, "viewBox", "0 0 16 16");
    			add_location(svg2, file$9, 85, 6, 2522);
    			attr_dev(button5, "class", "svelte-12n7rfi");
    			add_location(button5, file$9, 84, 4, 2480);
    			attr_dev(div2, "class", "button control svelte-12n7rfi");
    			add_location(div2, file$9, 82, 2, 2416);
    			attr_dev(div3, "class", "titlebar svelte-12n7rfi");
    			set_style(div3, "-webkit-app-region", "drag");
    			add_location(div3, file$9, 28, 0, 617);
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
    			current = true;

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
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fly, { y: -50, duration: 250 }, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, fly, { y: -50, duration: 250 }, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		fly,
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleBar",
    			options,
    			id: create_fragment$9.name
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

    const file$8 = "src\\components\\Containers\\StudentsContainer.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = text(/*searchValue*/ ctx[0]);
    			add_location(p, file$8, 5, 2, 59);
    			attr_dev(div, "class", "svelte-15cnmpm");
    			add_location(div, file$8, 4, 0, 50);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentsContainer",
    			options,
    			id: create_fragment$8.name
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

    const file$7 = "src\\components\\Containers\\InstructorsContainer.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(p0, file$7, 5, 2, 59);
    			add_location(p1, file$7, 6, 2, 83);
    			add_location(p2, file$7, 7, 2, 107);
    			add_location(p3, file$7, 8, 2, 131);
    			add_location(p4, file$7, 9, 2, 155);
    			add_location(p5, file$7, 9, 24, 177);
    			add_location(p6, file$7, 10, 2, 201);
    			add_location(p7, file$7, 11, 2, 225);
    			add_location(p8, file$7, 12, 2, 249);
    			add_location(p9, file$7, 13, 2, 273);
    			add_location(p10, file$7, 13, 24, 295);
    			add_location(p11, file$7, 14, 2, 319);
    			add_location(p12, file$7, 15, 2, 343);
    			add_location(p13, file$7, 16, 2, 367);
    			add_location(p14, file$7, 17, 2, 391);
    			add_location(p15, file$7, 17, 24, 413);
    			add_location(p16, file$7, 18, 2, 437);
    			add_location(p17, file$7, 19, 2, 461);
    			add_location(p18, file$7, 20, 2, 485);
    			add_location(p19, file$7, 21, 2, 509);
    			add_location(p20, file$7, 21, 24, 531);
    			add_location(p21, file$7, 22, 2, 555);
    			add_location(p22, file$7, 23, 2, 579);
    			add_location(p23, file$7, 24, 2, 603);
    			add_location(p24, file$7, 25, 2, 627);
    			add_location(p25, file$7, 25, 24, 649);
    			add_location(p26, file$7, 26, 2, 673);
    			add_location(p27, file$7, 27, 2, 697);
    			add_location(p28, file$7, 28, 2, 721);
    			add_location(p29, file$7, 29, 2, 745);
    			add_location(p30, file$7, 29, 24, 767);
    			add_location(p31, file$7, 30, 2, 791);
    			add_location(p32, file$7, 31, 2, 815);
    			add_location(p33, file$7, 32, 2, 839);
    			add_location(p34, file$7, 33, 2, 863);
    			add_location(p35, file$7, 33, 24, 885);
    			add_location(p36, file$7, 34, 2, 909);
    			add_location(p37, file$7, 35, 2, 933);
    			add_location(p38, file$7, 36, 2, 957);
    			add_location(p39, file$7, 37, 2, 981);
    			add_location(p40, file$7, 37, 24, 1003);
    			add_location(p41, file$7, 38, 2, 1027);
    			add_location(p42, file$7, 39, 2, 1051);
    			add_location(p43, file$7, 40, 2, 1075);
    			add_location(p44, file$7, 41, 2, 1099);
    			add_location(p45, file$7, 41, 24, 1121);
    			add_location(p46, file$7, 42, 2, 1145);
    			add_location(p47, file$7, 43, 2, 1169);
    			add_location(p48, file$7, 44, 2, 1193);
    			add_location(p49, file$7, 45, 2, 1217);
    			add_location(p50, file$7, 45, 24, 1239);
    			add_location(p51, file$7, 46, 2, 1263);
    			add_location(p52, file$7, 47, 2, 1287);
    			add_location(p53, file$7, 48, 2, 1311);
    			add_location(p54, file$7, 49, 2, 1335);
    			add_location(p55, file$7, 49, 24, 1357);
    			add_location(p56, file$7, 50, 2, 1381);
    			add_location(p57, file$7, 51, 2, 1405);
    			add_location(p58, file$7, 52, 2, 1429);
    			add_location(p59, file$7, 53, 2, 1453);
    			add_location(p60, file$7, 53, 24, 1475);
    			add_location(p61, file$7, 54, 2, 1499);
    			add_location(p62, file$7, 55, 2, 1523);
    			add_location(p63, file$7, 56, 2, 1547);
    			add_location(p64, file$7, 57, 2, 1571);
    			add_location(p65, file$7, 57, 24, 1593);
    			add_location(p66, file$7, 58, 2, 1617);
    			add_location(p67, file$7, 59, 2, 1641);
    			add_location(p68, file$7, 60, 2, 1665);
    			add_location(p69, file$7, 61, 2, 1689);
    			add_location(p70, file$7, 61, 24, 1711);
    			add_location(p71, file$7, 62, 2, 1735);
    			add_location(p72, file$7, 63, 2, 1759);
    			add_location(p73, file$7, 64, 2, 1783);
    			add_location(p74, file$7, 65, 2, 1807);
    			add_location(p75, file$7, 65, 24, 1829);
    			add_location(p76, file$7, 66, 2, 1853);
    			add_location(p77, file$7, 67, 2, 1877);
    			add_location(p78, file$7, 68, 2, 1901);
    			add_location(p79, file$7, 69, 2, 1925);
    			add_location(div, file$7, 4, 0, 50);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InstructorsContainer",
    			options,
    			id: create_fragment$7.name
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

    const file$6 = "src\\components\\Containers\\LogbookContainer.svelte";

    function create_fragment$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-15cnmpm");
    			add_location(div, file$6, 0, 0, 0);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LogbookContainer",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\inferace\SearchBar.svelte generated by Svelte v3.44.0 */
    const file$5 = "src\\components\\inferace\\SearchBar.svelte";

    // (28:4) {:else}
    function create_else_block$2(ctx) {
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
    			add_location(line0, file$5, 40, 8, 1102);
    			attr_dev(line1, "x1", "6");
    			attr_dev(line1, "y1", "6");
    			attr_dev(line1, "x2", "18");
    			attr_dev(line1, "y2", "18");
    			add_location(line1, file$5, 46, 8, 1212);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "delete svelte-1jr9726");
    			add_location(svg, file$5, 28, 6, 790);
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
    		id: create_else_block$2.name,
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
    			add_location(circle, file$5, 24, 8, 655);
    			attr_dev(line, "x1", "21");
    			attr_dev(line, "y1", "21");
    			attr_dev(line, "x2", "16.65");
    			attr_dev(line, "y2", "16.65");
    			add_location(line, file$5, 25, 8, 704);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-search svelte-1jr9726");
    			add_location(svg, file$5, 13, 6, 334);
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

    function create_fragment$5(ctx) {
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
    		return create_else_block$2;
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
    			attr_dev(input, "class", "svelte-1jr9726");
    			add_location(input, file$5, 10, 2, 205);
    			attr_dev(button, "class", "svelte-1jr9726");
    			add_location(button, file$5, 11, 2, 267);
    			attr_dev(div, "class", "svelte-1jr9726");
    			add_location(div, file$5, 9, 0, 153);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$5.name
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
    const file$4 = "src\\components\\MainContainer.svelte";

    // (11:2) {#if tabIndex === 0 || tabIndex === 1}
    function create_if_block_2$1(ctx) {
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(11:2) {#if tabIndex === 0 || tabIndex === 1}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
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
    			attr_dev(div, "class", "body svelte-1rywj10");
    			add_location(div, file$4, 18, 4, 612);
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
    			attr_dev(div, "class", "body svelte-1rywj10");
    			add_location(div, file$4, 14, 4, 504);
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

    function create_fragment$4(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = (/*tabIndex*/ ctx[0] === 0 || /*tabIndex*/ ctx[0] === 1) && create_if_block_2$1(ctx);
    	const if_block_creators = [create_if_block$1, create_if_block_1$1, create_else_block$1];
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
    			attr_dev(div, "class", "wrapper svelte-1rywj10");
    			add_location(div, file$4, 9, 0, 366);
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
    					if_block0 = create_if_block_2$1(ctx);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainContainer",
    			options,
    			id: create_fragment$4.name
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
    const file$3 = "src\\components\\inferace\\AddButton.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(line0, file$3, 10, 212, 435);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$3, 10, 256, 479);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "1");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-plus svelte-1lzg8er");
    			add_location(svg, file$3, 10, 2, 225);
    			attr_dev(button, "class", "svelte-1lzg8er");
    			add_location(button, file$3, 9, 0, 157);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { addPressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddButton",
    			options,
    			id: create_fragment$3.name
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
    const file$2 = "src\\components\\AddScreen.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-wfuzc8");
    			add_location(div, file$2, 9, 0, 157);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { addPressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddScreen",
    			options,
    			id: create_fragment$2.name
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

    /* src\components\LoadingScreen.svelte generated by Svelte v3.44.0 */
    const file$1 = "src\\components\\LoadingScreen.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let t0;
    	let p;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*statusMessage*/ ctx[0]);
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$1, 24, 4, 584);
    			attr_dev(path1, "class", "eye svelte-1xsrb67");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$1, 25, 4, 2629);
    			attr_dev(path2, "class", "eye svelte-1xsrb67");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$1, 26, 4, 3084);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$1, 27, 4, 3535);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$1, 30, 4, 9014);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$1, 31, 4, 9048);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$1, 29, 4, 8886);
    			add_location(defs, file$1, 28, 4, 8874);
    			attr_dev(svg, "width", "60");
    			attr_dev(svg, "height", "68");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1xsrb67");
    			add_location(svg, file$1, 23, 2, 483);
    			attr_dev(p, "class", "svelte-1xsrb67");
    			add_location(p, file$1, 35, 2, 9137);
    			attr_dev(div, "class", "svelte-1xsrb67");
    			add_location(div, file$1, 22, 0, 474);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, defs);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*statusMessage*/ 1) set_data_dev(t1, /*statusMessage*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots('LoadingScreen', slots, []);
    	const { ipcRenderer } = require("electron");
    	let { doneLoading } = $$props;
    	let statusMessage = "Now loading...";

    	ipcRenderer.on("status-message", (event, arg) => {
    		$$invalidate(0, statusMessage = arg);

    		if (statusMessage === "Starting application...") {
    			setTimeout(
    				() => {
    					$$invalidate(1, doneLoading = true);
    				},
    				3000
    			);
    		}
    	});

    	onDestroy(() => {
    		$$invalidate(0, statusMessage = null);
    	});

    	const writable_props = ['doneLoading'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LoadingScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('doneLoading' in $$props) $$invalidate(1, doneLoading = $$props.doneLoading);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		ipcRenderer,
    		doneLoading,
    		statusMessage
    	});

    	$$self.$inject_state = $$props => {
    		if ('doneLoading' in $$props) $$invalidate(1, doneLoading = $$props.doneLoading);
    		if ('statusMessage' in $$props) $$invalidate(0, statusMessage = $$props.statusMessage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [statusMessage, doneLoading];
    }

    class LoadingScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { doneLoading: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoadingScreen",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*doneLoading*/ ctx[1] === undefined && !('doneLoading' in props)) {
    			console.warn("<LoadingScreen> was created without expected prop 'doneLoading'");
    		}
    	}

    	get doneLoading() {
    		throw new Error("<LoadingScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set doneLoading(value) {
    		throw new Error("<LoadingScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.0 */
    const file = "src\\App.svelte";

    // (14:0) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let main;
    	let titlebar;
    	let updating_tabIndex;
    	let t1;
    	let maincontainer;
    	let t2;
    	let current;
    	let if_block0 = /*addPressed*/ ctx[1] && create_if_block_2(ctx);

    	function titlebar_tabIndex_binding(value) {
    		/*titlebar_tabIndex_binding*/ ctx[5](value);
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

    	let if_block1 = /*tabIndex*/ ctx[0] != 2 && create_if_block_1(ctx);

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
    			add_location(main, file, 17, 1, 513);
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
    		p: function update(ctx, dirty) {
    			if (/*addPressed*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*addPressed*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
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
    					if_block1 = create_if_block_1(ctx);
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(14:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#if !doneLoading}
    function create_if_block(ctx) {
    	let loadingscreen;
    	let updating_doneLoading;
    	let current;

    	function loadingscreen_doneLoading_binding(value) {
    		/*loadingscreen_doneLoading_binding*/ ctx[3](value);
    	}

    	let loadingscreen_props = {};

    	if (/*doneLoading*/ ctx[2] !== void 0) {
    		loadingscreen_props.doneLoading = /*doneLoading*/ ctx[2];
    	}

    	loadingscreen = new LoadingScreen({
    			props: loadingscreen_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(loadingscreen, 'doneLoading', loadingscreen_doneLoading_binding));

    	const block = {
    		c: function create() {
    			create_component(loadingscreen.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loadingscreen, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loadingscreen_changes = {};

    			if (!updating_doneLoading && dirty & /*doneLoading*/ 4) {
    				updating_doneLoading = true;
    				loadingscreen_changes.doneLoading = /*doneLoading*/ ctx[2];
    				add_flush_callback(() => updating_doneLoading = false);
    			}

    			loadingscreen.$set(loadingscreen_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingscreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loadingscreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loadingscreen, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:0) {#if !doneLoading}",
    		ctx
    	});

    	return block;
    }

    // (15:1) {#if addPressed}
    function create_if_block_2(ctx) {
    	let addscreen;
    	let updating_addPressed;
    	let current;

    	function addscreen_addPressed_binding(value) {
    		/*addscreen_addPressed_binding*/ ctx[4](value);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(15:1) {#if addPressed}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {#if tabIndex != 2}
    function create_if_block_1(ctx) {
    	let addbutton;
    	let updating_addPressed;
    	let current;

    	function addbutton_addPressed_binding(value) {
    		/*addbutton_addPressed_binding*/ ctx[6](value);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:2) {#if tabIndex != 2}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*doneLoading*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let doneLoading = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function loadingscreen_doneLoading_binding(value) {
    		doneLoading = value;
    		$$invalidate(2, doneLoading);
    	}

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
    		LoadingScreen,
    		tabIndex,
    		addPressed,
    		doneLoading
    	});

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    		if ('doneLoading' in $$props) $$invalidate(2, doneLoading = $$props.doneLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tabIndex,
    		addPressed,
    		doneLoading,
    		loadingscreen_doneLoading_binding,
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
