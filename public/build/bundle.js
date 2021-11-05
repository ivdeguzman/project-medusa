
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
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
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    const { console: console_1$3 } = globals;
    const file$g = "src\\components\\TitleBar.svelte";

    function create_fragment$g(ctx) {
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
    			button3.textContent = "Employees";
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
    			add_location(path0, file$g, 41, 8, 1048);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z");
    			add_location(path1, file$g, 46, 8, 1237);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "16");
    			attr_dev(svg0, "height", "16");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "class", "bi bi-x-lg svelte-1olytxk");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			add_location(svg0, file$g, 33, 6, 854);
    			attr_dev(button0, "class", "svelte-1olytxk");
    			add_location(button0, file$g, 32, 4, 812);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "clip-rule", "evenodd");
    			attr_dev(path2, "d", "M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z");
    			add_location(path2, file$g, 63, 8, 1719);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "16");
    			attr_dev(svg1, "height", "16");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "class", "bi bi-dash-lg svelte-1olytxk");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			add_location(svg1, file$g, 55, 6, 1522);
    			attr_dev(button1, "class", "svelte-1olytxk");
    			add_location(button1, file$g, 54, 4, 1480);
    			attr_dev(div0, "class", "button control svelte-1olytxk");
    			add_location(div0, file$g, 30, 2, 752);
    			attr_dev(button2, "id", "studentsTab");
    			attr_dev(button2, "class", "svelte-1olytxk");
    			toggle_class(button2, "active", /*tabIndex*/ ctx[0] === 0);
    			add_location(button2, file$g, 75, 4, 2018);
    			attr_dev(button3, "id", "employeesTab");
    			attr_dev(button3, "class", "svelte-1olytxk");
    			toggle_class(button3, "active", /*tabIndex*/ ctx[0] === 1);
    			add_location(button3, file$g, 76, 4, 2121);
    			attr_dev(button4, "id", "logbookTab");
    			attr_dev(button4, "class", "svelte-1olytxk");
    			toggle_class(button4, "active", /*tabIndex*/ ctx[0] === 2);
    			add_location(button4, file$g, 77, 4, 2227);
    			attr_dev(div1, "class", "button tab svelte-1olytxk");
    			add_location(div1, file$g, 74, 2, 1988);
    			attr_dev(path3, "d", "M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z");
    			add_location(path3, file$g, 93, 8, 2714);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "16");
    			attr_dev(svg2, "height", "16");
    			attr_dev(svg2, "fill", "currentColor");
    			attr_dev(svg2, "class", "bi bi-fullscreen svelte-1olytxk");
    			attr_dev(svg2, "viewBox", "0 0 16 16");
    			add_location(svg2, file$g, 85, 6, 2514);
    			attr_dev(button5, "class", "svelte-1olytxk");
    			add_location(button5, file$g, 84, 4, 2472);
    			attr_dev(div2, "class", "button control svelte-1olytxk");
    			add_location(div2, file$g, 82, 2, 2408);
    			attr_dev(div3, "class", "titlebar svelte-1olytxk");
    			set_style(div3, "-webkit-app-region", "drag");
    			add_location(div3, file$g, 28, 0, 615);
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
    					listen_dev(button3, "click", /*employeesTab*/ ctx[5], false, false, false),
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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

    	function employeesTab() {
    		$$invalidate(0, tabIndex = 1);
    		console.log(tabIndex);
    	}

    	function logbookTab() {
    		$$invalidate(0, tabIndex = 2);
    		console.log(tabIndex);
    	}

    	const writable_props = ['tabIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<TitleBar> was created with unknown prop '${key}'`);
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
    		employeesTab,
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
    		employeesTab,
    		logbookTab
    	];
    }

    class TitleBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleBar",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabIndex*/ ctx[0] === undefined && !('tabIndex' in props)) {
    			console_1$3.warn("<TitleBar> was created without expected prop 'tabIndex'");
    		}
    	}

    	get tabIndex() {
    		throw new Error("<TitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
    		throw new Error("<TitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\interface\StudentsCard.svelte generated by Svelte v3.44.0 */

    const { console: console_1$2 } = globals;
    const file$f = "src\\components\\interface\\StudentsCard.svelte";

    // (13:4) {:else}
    function create_else_block$6(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21");
    			add_location(path, file$f, 14, 8, 823);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "cross svelte-19nv15s");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$f, 13, 6, 727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#if Student.LoggedIn}
    function create_if_block$c(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path0, file$f, 9, 8, 409);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z");
    			add_location(path1, file$f, 10, 8, 511);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "check svelte-19nv15s");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$f, 8, 6, 313);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(8:4) {#if Student.LoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p0;
    	let t1_value = /*Student*/ ctx[0].Name.First + "";
    	let t1;
    	let t2;
    	let t3_value = /*Student*/ ctx[0].Name.Last + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*Student*/ ctx[0].Student.Course + "";
    	let t5;
    	let t6;
    	let t7_value = /*Student*/ ctx[0].Student.Year + "";
    	let t7;
    	let t8;
    	let t9_value = /*Student*/ ctx[0].Student.Section + "";
    	let t9;
    	let t10;
    	let button;
    	let svg;
    	let path;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*Student*/ ctx[0].LoggedIn) return create_if_block$c;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = text("-");
    			t9 = text(t9_value);
    			t10 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(div0, "class", "status svelte-19nv15s");
    			toggle_class(div0, "check", /*Student*/ ctx[0].LoggedIn);
    			toggle_class(div0, "cross", !/*Student*/ ctx[0].LoggedIn);
    			add_location(div0, file$f, 6, 2, 194);
    			attr_dev(p0, "class", "svelte-19nv15s");
    			add_location(p0, file$f, 19, 4, 1245);
    			attr_dev(p1, "class", "svelte-19nv15s");
    			add_location(p1, file$f, 20, 4, 1298);
    			attr_dev(div1, "class", "details svelte-19nv15s");
    			add_location(div1, file$f, 18, 2, 1218);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M9 5l7 7-7 7");
    			add_location(path, file$f, 24, 6, 1600);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "carat svelte-19nv15s");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			toggle_class(svg, "check", /*Student*/ ctx[0].LoggedIn);
    			toggle_class(svg, "cross", !/*Student*/ ctx[0].LoggedIn);
    			add_location(svg, file$f, 23, 4, 1443);
    			attr_dev(button, "class", "svelte-19nv15s");
    			add_location(button, file$f, 22, 2, 1392);
    			attr_dev(div2, "class", "card svelte-19nv15s");
    			add_location(div2, file$f, 5, 0, 96);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_block.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(div2, t10);
    			append_dev(div2, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(console.log(/*Student*/ ctx[0].Name))) console.log(/*Student*/ ctx[0].Name).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty & /*Student*/ 1) {
    				toggle_class(div0, "check", /*Student*/ ctx[0].LoggedIn);
    			}

    			if (dirty & /*Student*/ 1) {
    				toggle_class(div0, "cross", !/*Student*/ ctx[0].LoggedIn);
    			}

    			if ((!current || dirty & /*Student*/ 1) && t1_value !== (t1_value = /*Student*/ ctx[0].Name.First + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*Student*/ 1) && t3_value !== (t3_value = /*Student*/ ctx[0].Name.Last + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*Student*/ 1) && t5_value !== (t5_value = /*Student*/ ctx[0].Student.Course + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*Student*/ 1) && t7_value !== (t7_value = /*Student*/ ctx[0].Student.Year + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*Student*/ 1) && t9_value !== (t9_value = /*Student*/ ctx[0].Student.Section + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*Student*/ 1) {
    				toggle_class(svg, "check", /*Student*/ ctx[0].LoggedIn);
    			}

    			if (dirty & /*Student*/ 1) {
    				toggle_class(svg, "cross", !/*Student*/ ctx[0].LoggedIn);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, fly, { delay: 200, y: -50, duration: 250 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StudentsCard', slots, []);
    	let { Student } = $$props;
    	const writable_props = ['Student'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<StudentsCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Student' in $$props) $$invalidate(0, Student = $$props.Student);
    	};

    	$$self.$capture_state = () => ({ fly, fade, Student });

    	$$self.$inject_state = $$props => {
    		if ('Student' in $$props) $$invalidate(0, Student = $$props.Student);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Student];
    }

    class StudentsCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { Student: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentsCard",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Student*/ ctx[0] === undefined && !('Student' in props)) {
    			console_1$2.warn("<StudentsCard> was created without expected prop 'Student'");
    		}
    	}

    	get Student() {
    		throw new Error("<StudentsCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Student(value) {
    		throw new Error("<StudentsCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\containers\StudentsContainer.svelte generated by Svelte v3.44.0 */
    const file$e = "src\\components\\containers\\StudentsContainer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (51:35) 
    function create_if_block_1$9(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "There is a problem with your request.";
    			add_location(p, file$e, 51, 4, 1379);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$9.name,
    		type: "if",
    		source: "(51:35) ",
    		ctx
    	});

    	return block;
    }

    // (47:2) {#if StudentData}
    function create_if_block$b(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*StudentData*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*Student*/ ctx[2]._id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*StudentData*/ 1) {
    				each_value = /*StudentData*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(47:2) {#if StudentData}",
    		ctx
    	});

    	return block;
    }

    // (48:4) {#each StudentData as Student (Student._id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let studentscard;
    	let current;

    	studentscard = new StudentsCard({
    			props: { Student: /*Student*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(studentscard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(studentscard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const studentscard_changes = {};
    			if (dirty & /*StudentData*/ 1) studentscard_changes.Student = /*Student*/ ctx[2];
    			studentscard.$set(studentscard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(studentscard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(studentscard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(studentscard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(48:4) {#each StudentData as Student (Student._id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$b, create_if_block_1$9];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*StudentData*/ ctx[0]) return 0;
    		if (/*StudentData*/ ctx[0] == "Error") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "svelte-75xryc");
    			add_location(div, file$e, 45, 0, 1213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
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
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StudentsContainer', slots, []);
    	let { searchValue } = $$props;
    	let StudentData;

    	onMount(async () => {
    		socket.emit("studentDataGet");
    	});

    	onDestroy(() => {
    		$$invalidate(0, StudentData = undefined);
    		$$invalidate(1, searchValue = "");
    	});

    	socket.on("studentDataRetriveList", list => {
    		$$invalidate(0, StudentData = list);
    	});

    	socket.on("studentDataInsert", insert => {
    		$$invalidate(0, StudentData = [...StudentData, insert]);
    	});

    	socket.on("studentDataUpdate", update => {
    		StudentData.forEach(Student => {
    			if (Student._id == update._id) {
    				Student.Name.First = update.Name.First;
    				Student.Name.Last = update.Name.Last;
    				Student.Student.Course = update.Student.Course;
    				Student.Student.Year = update.Student.Year;
    				Student.Student.Section = update.Student.Section;
    				Student.LoggedIn = update.LoggedIn;
    			}
    		});

    		$$invalidate(0, StudentData);
    	});

    	socket.on("studentDataDelete", deleted => {
    		const updateStudentData = StudentData.filter(Student => {
    			return Student._id != deleted;
    		});

    		$$invalidate(0, StudentData = updateStudentData);
    	});

    	const writable_props = ['searchValue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StudentsContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('searchValue' in $$props) $$invalidate(1, searchValue = $$props.searchValue);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		StudentsCard,
    		searchValue,
    		StudentData
    	});

    	$$self.$inject_state = $$props => {
    		if ('searchValue' in $$props) $$invalidate(1, searchValue = $$props.searchValue);
    		if ('StudentData' in $$props) $$invalidate(0, StudentData = $$props.StudentData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [StudentData, searchValue];
    }

    class StudentsContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { searchValue: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentsContainer",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchValue*/ ctx[1] === undefined && !('searchValue' in props)) {
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

    /* src\components\interface\EmployeesCard.svelte generated by Svelte v3.44.0 */

    const { console: console_1$1 } = globals;
    const file$d = "src\\components\\interface\\EmployeesCard.svelte";

    // (13:4) {:else}
    function create_else_block$5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21");
    			add_location(path, file$d, 14, 8, 827);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "cross svelte-19nv15s");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$d, 13, 6, 731);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#if Employee.LoggedIn}
    function create_if_block$a(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path0, file$d, 9, 8, 413);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z");
    			add_location(path1, file$d, 10, 8, 515);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "check svelte-19nv15s");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$d, 8, 6, 317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(8:4) {#if Employee.LoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p0;
    	let t1_value = /*Employee*/ ctx[0].Name.First + "";
    	let t1;
    	let t2;
    	let t3_value = /*Employee*/ ctx[0].Name.Last + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*Employee*/ ctx[0].Occupation + "";
    	let t5;
    	let t6;
    	let button;
    	let svg;
    	let path;
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*Employee*/ ctx[0].LoggedIn) return create_if_block$a;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(div0, "class", "status svelte-19nv15s");
    			toggle_class(div0, "check", /*Employee*/ ctx[0].LoggedIn);
    			toggle_class(div0, "cross", !/*Employee*/ ctx[0].LoggedIn);
    			add_location(div0, file$d, 6, 2, 195);
    			attr_dev(p0, "class", "svelte-19nv15s");
    			add_location(p0, file$d, 19, 4, 1249);
    			attr_dev(p1, "class", "svelte-19nv15s");
    			add_location(p1, file$d, 20, 4, 1304);
    			attr_dev(div1, "class", "details svelte-19nv15s");
    			add_location(div1, file$d, 18, 2, 1222);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M9 5l7 7-7 7");
    			add_location(path, file$d, 24, 6, 1557);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "carat svelte-19nv15s");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			toggle_class(svg, "check", /*Employee*/ ctx[0].LoggedIn);
    			toggle_class(svg, "cross", !/*Employee*/ ctx[0].LoggedIn);
    			add_location(svg, file$d, 23, 4, 1398);
    			attr_dev(button, "class", "svelte-19nv15s");
    			add_location(button, file$d, 22, 2, 1346);
    			attr_dev(div2, "class", "card svelte-19nv15s");
    			add_location(div2, file$d, 5, 0, 97);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_block.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(p1, t5);
    			append_dev(div2, t6);
    			append_dev(div2, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(console.log(/*Employee*/ ctx[0].Name))) console.log(/*Employee*/ ctx[0].Name).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty & /*Employee*/ 1) {
    				toggle_class(div0, "check", /*Employee*/ ctx[0].LoggedIn);
    			}

    			if (dirty & /*Employee*/ 1) {
    				toggle_class(div0, "cross", !/*Employee*/ ctx[0].LoggedIn);
    			}

    			if ((!current || dirty & /*Employee*/ 1) && t1_value !== (t1_value = /*Employee*/ ctx[0].Name.First + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*Employee*/ 1) && t3_value !== (t3_value = /*Employee*/ ctx[0].Name.Last + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*Employee*/ 1) && t5_value !== (t5_value = /*Employee*/ ctx[0].Occupation + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*Employee*/ 1) {
    				toggle_class(svg, "check", /*Employee*/ ctx[0].LoggedIn);
    			}

    			if (dirty & /*Employee*/ 1) {
    				toggle_class(svg, "cross", !/*Employee*/ ctx[0].LoggedIn);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, fly, { delay: 200, y: -50, duration: 250 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EmployeesCard', slots, []);
    	let { Employee } = $$props;
    	const writable_props = ['Employee'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<EmployeesCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Employee' in $$props) $$invalidate(0, Employee = $$props.Employee);
    	};

    	$$self.$capture_state = () => ({ fly, fade, Employee });

    	$$self.$inject_state = $$props => {
    		if ('Employee' in $$props) $$invalidate(0, Employee = $$props.Employee);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Employee];
    }

    class EmployeesCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { Employee: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmployeesCard",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Employee*/ ctx[0] === undefined && !('Employee' in props)) {
    			console_1$1.warn("<EmployeesCard> was created without expected prop 'Employee'");
    		}
    	}

    	get Employee() {
    		throw new Error("<EmployeesCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Employee(value) {
    		throw new Error("<EmployeesCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\containers\EmployeesContainer.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file$c = "src\\components\\containers\\EmployeesContainer.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (50:36) 
    function create_if_block_1$8(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "There is a problem with your request.";
    			add_location(p, file$c, 50, 4, 1321);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(50:36) ",
    		ctx
    	});

    	return block;
    }

    // (46:2) {#if EmployeeData}
    function create_if_block$9(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*EmployeeData*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*Employee*/ ctx[2]._id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*EmployeeData*/ 1) {
    				each_value = /*EmployeeData*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(46:2) {#if EmployeeData}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#each EmployeeData as Employee (Employee._id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let employeescard;
    	let current;

    	employeescard = new EmployeesCard({
    			props: { Employee: /*Employee*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(employeescard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(employeescard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const employeescard_changes = {};
    			if (dirty & /*EmployeeData*/ 1) employeescard_changes.Employee = /*Employee*/ ctx[2];
    			employeescard.$set(employeescard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(employeescard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(employeescard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(employeescard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(47:4) {#each EmployeeData as Employee (Employee._id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$9, create_if_block_1$8];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*EmployeeData*/ ctx[0]) return 0;
    		if (/*EmployeeData*/ ctx[0] == "Error") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "svelte-75xryc");
    			add_location(div, file$c, 44, 0, 1148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
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
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EmployeesContainer', slots, []);
    	let { searchValue } = $$props;
    	let EmployeeData;

    	onMount(async () => {
    		socket.emit("employeeDataGet");
    	});

    	onDestroy(() => {
    		$$invalidate(0, EmployeeData = undefined);
    		$$invalidate(1, searchValue = "");
    	});

    	socket.on("employeeDataRetriveList", list => {
    		$$invalidate(0, EmployeeData = list);
    	});

    	socket.on("employeeDataInsert", insert => {
    		$$invalidate(0, EmployeeData = [...EmployeeData, insert]);
    	});

    	socket.on("employeeDataUpdate", update => {
    		EmployeeData.forEach(Employee => {
    			if (Employee._id == update._id) {
    				Employee.Name.First = update.Name.First;
    				Employee.Name.Last = update.Name.Last;
    				Employee.Occupation = update.Occupation;
    				Employee.LoggedIn = update.LoggedIn;
    			}
    		});

    		$$invalidate(0, EmployeeData);
    	});

    	socket.on("employeeDataDelete", deleted => {
    		console.log(deleted);

    		const updateEmployeeData = EmployeeData.filter(Employee => {
    			return Employee._id != deleted;
    		});

    		$$invalidate(0, EmployeeData = updateEmployeeData);
    	});

    	const writable_props = ['searchValue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<EmployeesContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('searchValue' in $$props) $$invalidate(1, searchValue = $$props.searchValue);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		EmployeesCard,
    		searchValue,
    		EmployeeData
    	});

    	$$self.$inject_state = $$props => {
    		if ('searchValue' in $$props) $$invalidate(1, searchValue = $$props.searchValue);
    		if ('EmployeeData' in $$props) $$invalidate(0, EmployeeData = $$props.EmployeeData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [EmployeeData, searchValue];
    }

    class EmployeesContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { searchValue: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmployeesContainer",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchValue*/ ctx[1] === undefined && !('searchValue' in props)) {
    			console_1.warn("<EmployeesContainer> was created without expected prop 'searchValue'");
    		}
    	}

    	get searchValue() {
    		throw new Error("<EmployeesContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchValue(value) {
    		throw new Error("<EmployeesContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\containers\LogbookContainer.svelte generated by Svelte v3.44.0 */

    const file$b = "src\\components\\containers\\LogbookContainer.svelte";

    function create_fragment$b(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-15cnmpm");
    			add_location(div, file$b, 0, 0, 0);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LogbookContainer",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\components\interface\SearchBar.svelte generated by Svelte v3.44.0 */
    const file$a = "src\\components\\interface\\SearchBar.svelte";

    // (28:4) {:else}
    function create_else_block$4(ctx) {
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
    			add_location(line0, file$a, 40, 8, 1102);
    			attr_dev(line1, "x1", "6");
    			attr_dev(line1, "y1", "6");
    			attr_dev(line1, "x2", "18");
    			attr_dev(line1, "y2", "18");
    			add_location(line1, file$a, 46, 8, 1212);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "delete svelte-fl7ihg");
    			add_location(svg, file$a, 28, 6, 790);
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(28:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if searchValue == ""}
    function create_if_block$8(ctx) {
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
    			add_location(circle, file$a, 24, 8, 655);
    			attr_dev(line, "x1", "21");
    			attr_dev(line, "y1", "21");
    			attr_dev(line, "x2", "16.65");
    			attr_dev(line, "y2", "16.65");
    			add_location(line, file$a, 25, 8, 704);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-search svelte-fl7ihg");
    			add_location(svg, file$a, 13, 6, 334);
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(13:4) {#if searchValue == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let input;
    	let t;
    	let button;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*searchValue*/ ctx[0] == "") return create_if_block$8;
    		return create_else_block$4;
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
    			attr_dev(input, "class", "svelte-fl7ihg");
    			add_location(input, file$a, 10, 2, 205);
    			attr_dev(button, "class", "svelte-fl7ihg");
    			add_location(button, file$a, 11, 2, 267);
    			attr_dev(div, "class", "svelte-fl7ihg");
    			add_location(div, file$a, 9, 0, 153);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { searchValue: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$a.name
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
    const file$9 = "src\\components\\MainContainer.svelte";

    // (11:2) {#if tabIndex === 0 || tabIndex === 1}
    function create_if_block_2$4(ctx) {
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
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(11:2) {#if tabIndex === 0 || tabIndex === 1}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {:else}
    function create_else_block$3(ctx) {
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(22:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:27) 
    function create_if_block_1$7(ctx) {
    	let div;
    	let employeescontainer;
    	let updating_searchValue;
    	let current;

    	function employeescontainer_searchValue_binding(value) {
    		/*employeescontainer_searchValue_binding*/ ctx[4](value);
    	}

    	let employeescontainer_props = {};

    	if (/*searchValue*/ ctx[1] !== void 0) {
    		employeescontainer_props.searchValue = /*searchValue*/ ctx[1];
    	}

    	employeescontainer = new EmployeesContainer({
    			props: employeescontainer_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(employeescontainer, 'searchValue', employeescontainer_searchValue_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(employeescontainer.$$.fragment);
    			attr_dev(div, "class", "body svelte-1nasks9");
    			add_location(div, file$9, 18, 4, 600);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(employeescontainer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const employeescontainer_changes = {};

    			if (!updating_searchValue && dirty & /*searchValue*/ 2) {
    				updating_searchValue = true;
    				employeescontainer_changes.searchValue = /*searchValue*/ ctx[1];
    				add_flush_callback(() => updating_searchValue = false);
    			}

    			employeescontainer.$set(employeescontainer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(employeescontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(employeescontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(employeescontainer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(18:27) ",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if tabIndex === 0}
    function create_if_block$7(ctx) {
    	let div;
    	let studentscontainer;
    	let updating_searchValue;
    	let current;

    	function studentscontainer_searchValue_binding(value) {
    		/*studentscontainer_searchValue_binding*/ ctx[3](value);
    	}

    	let studentscontainer_props = {};

    	if (/*searchValue*/ ctx[1] !== void 0) {
    		studentscontainer_props.searchValue = /*searchValue*/ ctx[1];
    	}

    	studentscontainer = new StudentsContainer({
    			props: studentscontainer_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(studentscontainer, 'searchValue', studentscontainer_searchValue_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(studentscontainer.$$.fragment);
    			attr_dev(div, "class", "body svelte-1nasks9");
    			add_location(div, file$9, 14, 4, 489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(studentscontainer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const studentscontainer_changes = {};

    			if (!updating_searchValue && dirty & /*searchValue*/ 2) {
    				updating_searchValue = true;
    				studentscontainer_changes.searchValue = /*searchValue*/ ctx[1];
    				add_flush_callback(() => updating_searchValue = false);
    			}

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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(14:2) {#if tabIndex === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = (/*tabIndex*/ ctx[0] === 0 || /*tabIndex*/ ctx[0] === 1) && create_if_block_2$4(ctx);
    	const if_block_creators = [create_if_block$7, create_if_block_1$7, create_else_block$3];
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
    			attr_dev(div, "class", "wrapper svelte-1nasks9");
    			add_location(div, file$9, 9, 0, 351);
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
    					if_block0 = create_if_block_2$4(ctx);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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

    	function studentscontainer_searchValue_binding(value) {
    		searchValue = value;
    		$$invalidate(1, searchValue);
    	}

    	function employeescontainer_searchValue_binding(value) {
    		searchValue = value;
    		$$invalidate(1, searchValue);
    	}

    	$$self.$$set = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    	};

    	$$self.$capture_state = () => ({
    		StudentsContainer,
    		EmployeesContainer,
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

    	return [
    		tabIndex,
    		searchValue,
    		searchbar_searchValue_binding,
    		studentscontainer_searchValue_binding,
    		employeescontainer_searchValue_binding
    	];
    }

    class MainContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainContainer",
    			options,
    			id: create_fragment$9.name
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

    /* src\components\interface\AddButton.svelte generated by Svelte v3.44.0 */
    const file$8 = "src\\components\\interface\\AddButton.svelte";

    function create_fragment$8(ctx) {
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
    			add_location(line0, file$8, 10, 212, 435);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$8, 10, 256, 479);
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
    			add_location(svg, file$8, 10, 2, 225);
    			attr_dev(button, "class", "svelte-1lzg8er");
    			add_location(button, file$8, 9, 0, 157);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { addPressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddButton",
    			options,
    			id: create_fragment$8.name
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

    /* src\components\interface\FormAddPage1.svelte generated by Svelte v3.44.0 */

    const file$7 = "src\\components\\interface\\FormAddPage1.svelte";

    // (9:26) 
    function create_if_block_1$6(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Add an employee.";
    			attr_dev(h1, "class", "svelte-15vd76x");
    			add_location(h1, file$7, 9, 4, 473);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(9:26) ",
    		ctx
    	});

    	return block;
    }

    // (7:2) {#if tabIndex == 0}
    function create_if_block$6(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Add a student.";
    			attr_dev(h1, "class", "svelte-15vd76x");
    			add_location(h1, file$7, 7, 4, 416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(7:2) {#if tabIndex == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let svg;
    	let path;
    	let circle;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*tabIndex*/ ctx[0] == 0) return create_if_block$6;
    		if (/*tabIndex*/ ctx[0] == 1) return create_if_block_1$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			circle = svg_element("circle");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(path, "d", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2");
    			add_location(path, file$7, 5, 212, 284);
    			attr_dev(circle, "cx", "12");
    			attr_dev(circle, "cy", "7");
    			attr_dev(circle, "r", "4");
    			add_location(circle, file$7, 5, 271, 343);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-user svelte-15vd76x");
    			add_location(svg, file$7, 5, 2, 74);
    			attr_dev(div, "class", "container svelte-15vd76x");
    			add_location(div, file$7, 4, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    			append_dev(svg, circle);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
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
    	validate_slots('FormAddPage1', slots, []);
    	let { tabIndex } = $$props;
    	const writable_props = ['tabIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormAddPage1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    	};

    	$$self.$capture_state = () => ({ tabIndex });

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(0, tabIndex = $$props.tabIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tabIndex];
    }

    class FormAddPage1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { tabIndex: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormAddPage1",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabIndex*/ ctx[0] === undefined && !('tabIndex' in props)) {
    			console.warn("<FormAddPage1> was created without expected prop 'tabIndex'");
    		}
    	}

    	get tabIndex() {
    		throw new Error("<FormAddPage1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
    		throw new Error("<FormAddPage1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\interface\FormAddPage2.svelte generated by Svelte v3.44.0 */

    const file$6 = "src\\components\\interface\\FormAddPage2.svelte";

    // (9:26) 
    function create_if_block_1$5(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "The name of the employee is...";
    			attr_dev(h1, "class", "svelte-y56ntc");
    			add_location(h1, file$6, 9, 4, 195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(9:26) ",
    		ctx
    	});

    	return block;
    }

    // (7:2) {#if tabIndex == 0}
    function create_if_block$5(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "The name of the student is...";
    			attr_dev(h1, "class", "svelte-y56ntc");
    			add_location(h1, file$6, 7, 4, 123);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(7:2) {#if tabIndex == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let input0;
    	let t1;
    	let input1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*tabIndex*/ ctx[1] == 0) return create_if_block$5;
    		if (/*tabIndex*/ ctx[1] == 1) return create_if_block_1$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t1 = space();
    			input1 = element("input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "first-name");
    			attr_dev(input0, "id", "first-name");
    			attr_dev(input0, "placeholder", "Enter first name");
    			attr_dev(input0, "class", "svelte-y56ntc");
    			add_location(input0, file$6, 12, 4, 271);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "last-name");
    			attr_dev(input1, "id", "last-name");
    			attr_dev(input1, "placeholder", "Enter last name");
    			attr_dev(input1, "class", "svelte-y56ntc");
    			add_location(input1, file$6, 13, 4, 396);
    			attr_dev(div0, "class", "form svelte-y56ntc");
    			add_location(div0, file$6, 11, 2, 247);
    			attr_dev(div1, "class", "container svelte-y56ntc");
    			add_location(div1, file$6, 5, 0, 71);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*UserData*/ ctx[0].Name.First);
    			append_dev(div0, t1);
    			append_dev(div0, input1);
    			set_input_value(input1, /*UserData*/ ctx[0].Name.Last);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			}

    			if (dirty & /*UserData*/ 1 && input0.value !== /*UserData*/ ctx[0].Name.First) {
    				set_input_value(input0, /*UserData*/ ctx[0].Name.First);
    			}

    			if (dirty & /*UserData*/ 1 && input1.value !== /*UserData*/ ctx[0].Name.Last) {
    				set_input_value(input1, /*UserData*/ ctx[0].Name.Last);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}

    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('FormAddPage2', slots, []);
    	let { tabIndex } = $$props;
    	let { UserData } = $$props;
    	const writable_props = ['tabIndex', 'UserData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormAddPage2> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		UserData.Name.First = this.value;
    		$$invalidate(0, UserData);
    	}

    	function input1_input_handler() {
    		UserData.Name.Last = this.value;
    		$$invalidate(0, UserData);
    	}

    	$$self.$$set = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(1, tabIndex = $$props.tabIndex);
    		if ('UserData' in $$props) $$invalidate(0, UserData = $$props.UserData);
    	};

    	$$self.$capture_state = () => ({ tabIndex, UserData });

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(1, tabIndex = $$props.tabIndex);
    		if ('UserData' in $$props) $$invalidate(0, UserData = $$props.UserData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [UserData, tabIndex, input0_input_handler, input1_input_handler];
    }

    class FormAddPage2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { tabIndex: 1, UserData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormAddPage2",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabIndex*/ ctx[1] === undefined && !('tabIndex' in props)) {
    			console.warn("<FormAddPage2> was created without expected prop 'tabIndex'");
    		}

    		if (/*UserData*/ ctx[0] === undefined && !('UserData' in props)) {
    			console.warn("<FormAddPage2> was created without expected prop 'UserData'");
    		}
    	}

    	get tabIndex() {
    		throw new Error("<FormAddPage2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
    		throw new Error("<FormAddPage2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get UserData() {
    		throw new Error("<FormAddPage2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set UserData(value) {
    		throw new Error("<FormAddPage2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\interface\FormAddPage3.svelte generated by Svelte v3.44.0 */

    const file$5 = "src\\components\\interface\\FormAddPage3.svelte";

    // (9:26) 
    function create_if_block_3$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This lovely employee is...";
    			attr_dev(h1, "class", "svelte-1ms7udb");
    			add_location(h1, file$5, 9, 4, 192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(9:26) ",
    		ctx
    	});

    	return block;
    }

    // (7:2) {#if tabIndex == 0}
    function create_if_block_2$3(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This student belongs to...";
    			attr_dev(h1, "class", "svelte-1ms7udb");
    			add_location(h1, file$5, 7, 4, 123);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(7:2) {#if tabIndex == 0}",
    		ctx
    	});

    	return block;
    }

    // (19:28) 
    function create_if_block_1$4(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "first svelte-1ms7udb");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "occupation");
    			attr_dev(input, "id", "occupation");
    			attr_dev(input, "placeholder", "Enter employee occupation");
    			add_location(input, file$5, 19, 6, 958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*UserData*/ ctx[0].Occupation);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*UserData*/ 1 && input.value !== /*UserData*/ ctx[0].Occupation) {
    				set_input_value(input, /*UserData*/ ctx[0].Occupation);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(19:28) ",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if tabIndex == 0}
    function create_if_block$4(ctx) {
    	let input0;
    	let t0;
    	let div;
    	let input1;
    	let t1;
    	let input2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input0 = element("input");
    			t0 = space();
    			div = element("div");
    			input1 = element("input");
    			t1 = space();
    			input2 = element("input");
    			attr_dev(input0, "class", "first svelte-1ms7udb");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "student-course");
    			attr_dev(input0, "id", "student-course");
    			attr_dev(input0, "placeholder", "Enter student course");
    			add_location(input0, file$5, 13, 6, 291);
    			attr_dev(input1, "type", "tel");
    			attr_dev(input1, "oninput", "this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');");
    			attr_dev(input1, "name", "student-year");
    			attr_dev(input1, "id", "student-year");
    			attr_dev(input1, "placeholder", "Year");
    			attr_dev(input1, "class", "svelte-1ms7udb");
    			add_location(input1, file$5, 15, 8, 482);
    			attr_dev(input2, "type", "tel");
    			attr_dev(input2, "oninput", "this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');");
    			attr_dev(input2, "name", "student-section");
    			attr_dev(input2, "id", "student-section");
    			attr_dev(input2, "placeholder", "Section");
    			attr_dev(input2, "class", "svelte-1ms7udb");
    			add_location(input2, file$5, 16, 8, 693);
    			attr_dev(div, "class", "sub-form svelte-1ms7udb");
    			add_location(div, file$5, 14, 6, 448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*UserData*/ ctx[0].Student.Course);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input1);
    			set_input_value(input1, /*UserData*/ ctx[0].Student.Year);
    			append_dev(div, t1);
    			append_dev(div, input2);
    			set_input_value(input2, /*UserData*/ ctx[0].Student.Section);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*UserData*/ 1 && input0.value !== /*UserData*/ ctx[0].Student.Course) {
    				set_input_value(input0, /*UserData*/ ctx[0].Student.Course);
    			}

    			if (dirty & /*UserData*/ 1) {
    				set_input_value(input1, /*UserData*/ ctx[0].Student.Year);
    			}

    			if (dirty & /*UserData*/ 1) {
    				set_input_value(input2, /*UserData*/ ctx[0].Student.Section);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(13:4) {#if tabIndex == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let t;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*tabIndex*/ ctx[1] == 0) return create_if_block_2$3;
    		if (/*tabIndex*/ ctx[1] == 1) return create_if_block_3$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*tabIndex*/ ctx[1] == 0) return create_if_block$4;
    		if (/*tabIndex*/ ctx[1] == 1) return create_if_block_1$4;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "form svelte-1ms7udb");
    			add_location(div0, file$5, 11, 2, 240);
    			attr_dev(div1, "class", "container svelte-1ms7udb");
    			add_location(div1, file$5, 5, 0, 71);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			if (if_block1) if_block1.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, t);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) {
    				if_block1.d();
    			}
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
    	validate_slots('FormAddPage3', slots, []);
    	let { tabIndex } = $$props;
    	let { UserData } = $$props;
    	const writable_props = ['tabIndex', 'UserData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormAddPage3> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		UserData.Student.Course = this.value;
    		$$invalidate(0, UserData);
    	}

    	function input1_input_handler() {
    		UserData.Student.Year = this.value;
    		$$invalidate(0, UserData);
    	}

    	function input2_input_handler() {
    		UserData.Student.Section = this.value;
    		$$invalidate(0, UserData);
    	}

    	function input_input_handler() {
    		UserData.Occupation = this.value;
    		$$invalidate(0, UserData);
    	}

    	$$self.$$set = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(1, tabIndex = $$props.tabIndex);
    		if ('UserData' in $$props) $$invalidate(0, UserData = $$props.UserData);
    	};

    	$$self.$capture_state = () => ({ tabIndex, UserData });

    	$$self.$inject_state = $$props => {
    		if ('tabIndex' in $$props) $$invalidate(1, tabIndex = $$props.tabIndex);
    		if ('UserData' in $$props) $$invalidate(0, UserData = $$props.UserData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		UserData,
    		tabIndex,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input_input_handler
    	];
    }

    class FormAddPage3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { tabIndex: 1, UserData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormAddPage3",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabIndex*/ ctx[1] === undefined && !('tabIndex' in props)) {
    			console.warn("<FormAddPage3> was created without expected prop 'tabIndex'");
    		}

    		if (/*UserData*/ ctx[0] === undefined && !('UserData' in props)) {
    			console.warn("<FormAddPage3> was created without expected prop 'UserData'");
    		}
    	}

    	get tabIndex() {
    		throw new Error("<FormAddPage3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
    		throw new Error("<FormAddPage3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get UserData() {
    		throw new Error("<FormAddPage3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set UserData(value) {
    		throw new Error("<FormAddPage3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\interface\FormAddPage4.svelte generated by Svelte v3.44.0 */

    const file$4 = "src\\components\\interface\\FormAddPage4.svelte";

    // (19:4) {:else}
    function create_else_block_1$1(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*UserData*/ ctx[0].Images.First)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "First");
    			attr_dev(img, "class", "svelte-119rvjh");
    			add_location(img, file$4, 19, 6, 795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*selectFirst*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*UserData*/ 1 && !src_url_equal(img.src, img_src_value = /*UserData*/ ctx[0].Images.First)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(19:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if UserData.Images.First == ""}
    function create_if_block_1$3(ctx) {
    	let svg;
    	let line0;
    	let line1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", "12");
    			attr_dev(line0, "y1", "5");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "y2", "19");
    			add_location(line0, file$4, 17, 239, 680);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$4, 17, 283, 724);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-plus svelte-119rvjh");
    			add_location(svg, file$4, 17, 6, 447);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line0);
    			append_dev(svg, line1);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*selectFirst*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(17:4) {#if UserData.Images.First == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (24:4) {:else}
    function create_else_block$2(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*UserData*/ ctx[0].Images.Second)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Second");
    			attr_dev(img, "class", "svelte-119rvjh");
    			add_location(img, file$4, 24, 6, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*selectFirst*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*UserData*/ 1 && !src_url_equal(img.src, img_src_value = /*UserData*/ ctx[0].Images.Second)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(24:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#if UserData.Images.Second == ""}
    function create_if_block$3(ctx) {
    	let svg;
    	let line0;
    	let line1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", "12");
    			attr_dev(line0, "y1", "5");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "y2", "19");
    			add_location(line0, file$4, 22, 240, 1158);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$4, 22, 284, 1202);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "feather feather-plus svelte-119rvjh");
    			add_location(svg, file$4, 22, 6, 924);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line0);
    			append_dev(svg, line1);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*selectSecond*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(22:4) {#if UserData.Images.Second == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let t2;

    	function select_block_type(ctx, dirty) {
    		if (/*UserData*/ ctx[0].Images.First == "") return create_if_block_1$3;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*UserData*/ ctx[0].Images.Second == "") return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Click one of the circles, add an image.";
    			t1 = space();
    			div0 = element("div");
    			if_block0.c();
    			t2 = space();
    			if_block1.c();
    			attr_dev(h1, "class", "svelte-119rvjh");
    			add_location(h1, file$4, 14, 2, 330);
    			attr_dev(div0, "class", "form svelte-119rvjh");
    			add_location(div0, file$4, 15, 2, 382);
    			attr_dev(div1, "class", "container svelte-119rvjh");
    			add_location(div1, file$4, 13, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if_block0.m(div0, null);
    			append_dev(div0, t2);
    			if_block1.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t2);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			if_block1.d();
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
    	validate_slots('FormAddPage4', slots, []);
    	const { ipcRenderer } = require("electron");
    	let { UserData } = $$props;

    	function selectFirst() {
    		$$invalidate(0, UserData.Images.First = ipcRenderer.sendSync("select-image"), UserData);
    	}

    	function selectSecond() {
    		$$invalidate(0, UserData.Images.Second = ipcRenderer.sendSync("select-image"), UserData);
    	}

    	const writable_props = ['UserData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormAddPage4> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('UserData' in $$props) $$invalidate(0, UserData = $$props.UserData);
    	};

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		UserData,
    		selectFirst,
    		selectSecond
    	});

    	$$self.$inject_state = $$props => {
    		if ('UserData' in $$props) $$invalidate(0, UserData = $$props.UserData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [UserData, selectFirst, selectSecond];
    }

    class FormAddPage4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { UserData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormAddPage4",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*UserData*/ ctx[0] === undefined && !('UserData' in props)) {
    			console.warn("<FormAddPage4> was created without expected prop 'UserData'");
    		}
    	}

    	get UserData() {
    		throw new Error("<FormAddPage4>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set UserData(value) {
    		throw new Error("<FormAddPage4>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\interface\FormCompletePage.svelte generated by Svelte v3.44.0 */

    const file$3 = "src\\components\\interface\\FormCompletePage.svelte";

    // (26:27) 
    function create_if_block_2$2(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Request failed, please contact admin or try again later.";
    			attr_dev(h1, "class", "svelte-xc3jhf");
    			add_location(h1, file$3, 26, 4, 9001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(26:27) ",
    		ctx
    	});

    	return block;
    }

    // (24:27) 
    function create_if_block_1$2(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Request complete, please restart the Raspberry Pi.";
    			attr_dev(h1, "class", "svelte-xc3jhf");
    			add_location(h1, file$3, 24, 4, 8907);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(24:27) ",
    		ctx
    	});

    	return block;
    }

    // (22:2) {#if completed == 4}
    function create_if_block$2(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Processing your request...";
    			attr_dev(h1, "class", "svelte-xc3jhf");
    			add_location(h1, file$3, 22, 4, 8837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(22:2) {#if completed == 4}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
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
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*completed*/ ctx[0] == 4) return create_if_block$2;
    		if (/*completed*/ ctx[0] == 5) return create_if_block_1$2;
    		if (/*completed*/ ctx[0] == 6) return create_if_block_2$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

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
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$3, 10, 4, 258);
    			attr_dev(path1, "class", "eye");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$3, 11, 4, 2303);
    			attr_dev(path2, "class", "eye");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$3, 12, 4, 2758);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$3, 13, 4, 3209);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$3, 16, 4, 8688);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$3, 17, 4, 8722);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$3, 15, 4, 8560);
    			add_location(defs, file$3, 14, 4, 8548);
    			attr_dev(svg, "width", "60");
    			attr_dev(svg, "height", "68");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-xc3jhf");
    			add_location(svg, file$3, 9, 2, 157);
    			attr_dev(div, "class", "container svelte-xc3jhf");
    			add_location(div, file$3, 8, 0, 130);
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
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
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
    	validate_slots('FormCompletePage', slots, []);
    	let { completed } = $$props;
    	let { addPressed } = $$props;
    	completed = completed;
    	addPressed = addPressed;
    	const writable_props = ['completed', 'addPressed'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormCompletePage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('completed' in $$props) $$invalidate(0, completed = $$props.completed);
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	$$self.$capture_state = () => ({ completed, addPressed });

    	$$self.$inject_state = $$props => {
    		if ('completed' in $$props) $$invalidate(0, completed = $$props.completed);
    		if ('addPressed' in $$props) $$invalidate(1, addPressed = $$props.addPressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [completed, addPressed];
    }

    class FormCompletePage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { completed: 0, addPressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormCompletePage",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*completed*/ ctx[0] === undefined && !('completed' in props)) {
    			console.warn("<FormCompletePage> was created without expected prop 'completed'");
    		}

    		if (/*addPressed*/ ctx[1] === undefined && !('addPressed' in props)) {
    			console.warn("<FormCompletePage> was created without expected prop 'addPressed'");
    		}
    	}

    	get completed() {
    		throw new Error("<FormCompletePage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set completed(value) {
    		throw new Error("<FormCompletePage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addPressed() {
    		throw new Error("<FormCompletePage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addPressed(value) {
    		throw new Error("<FormCompletePage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\AddScreen.svelte generated by Svelte v3.44.0 */
    const file$2 = "src\\components\\AddScreen.svelte";

    // (107:4) {#if completed < 4}
    function create_if_block_7(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*cancelPressed*/ ctx[4]) return create_if_block_8;
    		if (/*cancelPressed*/ ctx[4]) return create_if_block_9;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(107:4) {#if completed < 4}",
    		ctx
    	});

    	return block;
    }

    // (110:30) 
    function create_if_block_9(ctx) {
    	let p;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Are you sure?";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Yes";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "No";
    			attr_dev(p, "class", "svelte-vlvxor");
    			add_location(p, file$2, 110, 8, 2973);
    			attr_dev(button0, "class", "yes-button svelte-vlvxor");
    			add_location(button0, file$2, 111, 8, 3003);
    			attr_dev(button1, "class", "no-button svelte-vlvxor");
    			add_location(button1, file$2, 112, 8, 3076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*closeConfirm*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*closePanel*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(110:30) ",
    		ctx
    	});

    	return block;
    }

    // (108:6) {#if !cancelPressed}
    function create_if_block_8(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Cancel";
    			attr_dev(button, "class", "svelte-vlvxor");
    			add_location(button, file$2, 108, 8, 2886);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*closePanel*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(108:6) {#if !cancelPressed}",
    		ctx
    	});

    	return block;
    }

    // (126:31) 
    function create_if_block_6(ctx) {
    	let formcompletepage;
    	let updating_addPressed;
    	let current;

    	function formcompletepage_addPressed_binding(value) {
    		/*formcompletepage_addPressed_binding*/ ctx[13](value);
    	}

    	let formcompletepage_props = { completed: /*completed*/ ctx[2] };

    	if (/*addPressed*/ ctx[0] !== void 0) {
    		formcompletepage_props.addPressed = /*addPressed*/ ctx[0];
    	}

    	formcompletepage = new FormCompletePage({
    			props: formcompletepage_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(formcompletepage, 'addPressed', formcompletepage_addPressed_binding));

    	const block = {
    		c: function create() {
    			create_component(formcompletepage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formcompletepage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formcompletepage_changes = {};
    			if (dirty & /*completed*/ 4) formcompletepage_changes.completed = /*completed*/ ctx[2];

    			if (!updating_addPressed && dirty & /*addPressed*/ 1) {
    				updating_addPressed = true;
    				formcompletepage_changes.addPressed = /*addPressed*/ ctx[0];
    				add_flush_callback(() => updating_addPressed = false);
    			}

    			formcompletepage.$set(formcompletepage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formcompletepage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formcompletepage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formcompletepage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(126:31) ",
    		ctx
    	});

    	return block;
    }

    // (124:31) 
    function create_if_block_5(ctx) {
    	let formaddpage4;
    	let updating_UserData;
    	let current;

    	function formaddpage4_UserData_binding(value) {
    		/*formaddpage4_UserData_binding*/ ctx[12](value);
    	}

    	let formaddpage4_props = {};

    	if (/*UserData*/ ctx[3] !== void 0) {
    		formaddpage4_props.UserData = /*UserData*/ ctx[3];
    	}

    	formaddpage4 = new FormAddPage4({
    			props: formaddpage4_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(formaddpage4, 'UserData', formaddpage4_UserData_binding));

    	const block = {
    		c: function create() {
    			create_component(formaddpage4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formaddpage4, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formaddpage4_changes = {};

    			if (!updating_UserData && dirty & /*UserData*/ 8) {
    				updating_UserData = true;
    				formaddpage4_changes.UserData = /*UserData*/ ctx[3];
    				add_flush_callback(() => updating_UserData = false);
    			}

    			formaddpage4.$set(formaddpage4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formaddpage4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formaddpage4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formaddpage4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(124:31) ",
    		ctx
    	});

    	return block;
    }

    // (122:31) 
    function create_if_block_4(ctx) {
    	let formaddpage3;
    	let updating_UserData;
    	let current;

    	function formaddpage3_UserData_binding(value) {
    		/*formaddpage3_UserData_binding*/ ctx[11](value);
    	}

    	let formaddpage3_props = { tabIndex: /*tabIndex*/ ctx[1] };

    	if (/*UserData*/ ctx[3] !== void 0) {
    		formaddpage3_props.UserData = /*UserData*/ ctx[3];
    	}

    	formaddpage3 = new FormAddPage3({
    			props: formaddpage3_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(formaddpage3, 'UserData', formaddpage3_UserData_binding));

    	const block = {
    		c: function create() {
    			create_component(formaddpage3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formaddpage3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formaddpage3_changes = {};
    			if (dirty & /*tabIndex*/ 2) formaddpage3_changes.tabIndex = /*tabIndex*/ ctx[1];

    			if (!updating_UserData && dirty & /*UserData*/ 8) {
    				updating_UserData = true;
    				formaddpage3_changes.UserData = /*UserData*/ ctx[3];
    				add_flush_callback(() => updating_UserData = false);
    			}

    			formaddpage3.$set(formaddpage3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formaddpage3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formaddpage3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formaddpage3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(122:31) ",
    		ctx
    	});

    	return block;
    }

    // (120:31) 
    function create_if_block_3(ctx) {
    	let formaddpage2;
    	let updating_UserData;
    	let current;

    	function formaddpage2_UserData_binding(value) {
    		/*formaddpage2_UserData_binding*/ ctx[10](value);
    	}

    	let formaddpage2_props = { tabIndex: /*tabIndex*/ ctx[1] };

    	if (/*UserData*/ ctx[3] !== void 0) {
    		formaddpage2_props.UserData = /*UserData*/ ctx[3];
    	}

    	formaddpage2 = new FormAddPage2({
    			props: formaddpage2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(formaddpage2, 'UserData', formaddpage2_UserData_binding));

    	const block = {
    		c: function create() {
    			create_component(formaddpage2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formaddpage2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formaddpage2_changes = {};
    			if (dirty & /*tabIndex*/ 2) formaddpage2_changes.tabIndex = /*tabIndex*/ ctx[1];

    			if (!updating_UserData && dirty & /*UserData*/ 8) {
    				updating_UserData = true;
    				formaddpage2_changes.UserData = /*UserData*/ ctx[3];
    				add_flush_callback(() => updating_UserData = false);
    			}

    			formaddpage2.$set(formaddpage2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formaddpage2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formaddpage2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formaddpage2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(120:31) ",
    		ctx
    	});

    	return block;
    }

    // (118:6) {#if completed == 0}
    function create_if_block_2$1(ctx) {
    	let formaddpage1;
    	let current;

    	formaddpage1 = new FormAddPage1({
    			props: { tabIndex: /*tabIndex*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(formaddpage1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(formaddpage1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const formaddpage1_changes = {};
    			if (dirty & /*tabIndex*/ 2) formaddpage1_changes.tabIndex = /*tabIndex*/ ctx[1];
    			formaddpage1.$set(formaddpage1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formaddpage1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formaddpage1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(formaddpage1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(118:6) {#if completed == 0}",
    		ctx
    	});

    	return block;
    }

    // (144:6) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let button;
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text("Close");
    			button.disabled = button_disabled_value = /*completed*/ ctx[2] == 4;
    			attr_dev(button, "class", "svelte-vlvxor");
    			add_location(button, file$2, 145, 10, 4402);
    			set_style(div, "width", "100%");
    			set_style(div, "display", "flex");
    			set_style(div, "justify-content", "center");
    			add_location(div, file$2, 144, 8, 4325);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*closeConfirm*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*completed*/ 4 && button_disabled_value !== (button_disabled_value = /*completed*/ ctx[2] == 4)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(144:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (131:6) {#if completed < 4}
    function create_if_block$1(ctx) {
    	let button;
    	let t0;
    	let button_disabled_value;
    	let t1;
    	let div4;
    	let div0;
    	let t2;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let t5;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type_3(ctx, dirty) {
    		if (/*completed*/ ctx[2] < 3) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Back");
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			t5 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			button.disabled = button_disabled_value = /*completed*/ ctx[2] <= 0;
    			attr_dev(button, "class", "svelte-vlvxor");
    			add_location(button, file$2, 131, 8, 3713);
    			attr_dev(div0, "class", "tab-index svelte-vlvxor");
    			toggle_class(div0, "completed", /*completed*/ ctx[2] >= 0);
    			add_location(div0, file$2, 133, 10, 3829);
    			attr_dev(div1, "class", "tab-index svelte-vlvxor");
    			toggle_class(div1, "completed", /*completed*/ ctx[2] >= 1);
    			add_location(div1, file$2, 134, 10, 3905);
    			attr_dev(div2, "class", "tab-index svelte-vlvxor");
    			toggle_class(div2, "completed", /*completed*/ ctx[2] >= 2);
    			add_location(div2, file$2, 135, 10, 3981);
    			attr_dev(div3, "class", "tab-index svelte-vlvxor");
    			toggle_class(div3, "completed", /*completed*/ ctx[2] >= 3);
    			add_location(div3, file$2, 136, 10, 4057);
    			attr_dev(div4, "class", "tab-indicator svelte-vlvxor");
    			add_location(div4, file$2, 132, 8, 3790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			insert_dev(target, t5, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*previous*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*completed*/ 4 && button_disabled_value !== (button_disabled_value = /*completed*/ ctx[2] <= 0)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*completed*/ 4) {
    				toggle_class(div0, "completed", /*completed*/ ctx[2] >= 0);
    			}

    			if (dirty & /*completed*/ 4) {
    				toggle_class(div1, "completed", /*completed*/ ctx[2] >= 1);
    			}

    			if (dirty & /*completed*/ 4) {
    				toggle_class(div2, "completed", /*completed*/ ctx[2] >= 2);
    			}

    			if (dirty & /*completed*/ 4) {
    				toggle_class(div3, "completed", /*completed*/ ctx[2] >= 3);
    			}

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t5);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(131:6) {#if completed < 4}",
    		ctx
    	});

    	return block;
    }

    // (141:8) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Finish";
    			attr_dev(button, "class", "svelte-vlvxor");
    			add_location(button, file$2, 141, 10, 4244);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*finish*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(141:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (139:8) {#if completed < 3}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Next";
    			attr_dev(button, "class", "svelte-vlvxor");
    			add_location(button, file$2, 139, 10, 4178);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*next*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(139:8) {#if completed < 3}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let section0;
    	let t0;
    	let section1;
    	let current_block_type_index;
    	let if_block1;
    	let t1;
    	let section2;
    	let div0_intro;
    	let div0_outro;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let if_block0 = /*completed*/ ctx[2] < 4 && create_if_block_7(ctx);

    	const if_block_creators = [
    		create_if_block_2$1,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6
    	];

    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*completed*/ ctx[2] == 0) return 0;
    		if (/*completed*/ ctx[2] == 1) return 1;
    		if (/*completed*/ ctx[2] == 2) return 2;
    		if (/*completed*/ ctx[2] == 3) return 3;
    		if (/*completed*/ ctx[2] >= 4) return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	function select_block_type_2(ctx, dirty) {
    		if (/*completed*/ ctx[2] < 4) return create_if_block$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block2 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			section0 = element("section");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			section1 = element("section");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			section2 = element("section");
    			if_block2.c();
    			attr_dev(section0, "class", "top-button svelte-vlvxor");
    			add_location(section0, file$2, 105, 4, 2795);
    			attr_dev(section1, "class", "middle-content");
    			add_location(section1, file$2, 116, 4, 3181);
    			attr_dev(section2, "class", "bottom-button svelte-vlvxor");
    			add_location(section2, file$2, 129, 4, 3645);
    			attr_dev(div0, "class", "forms svelte-vlvxor");
    			add_location(div0, file$2, 104, 2, 2686);
    			attr_dev(div1, "class", "container svelte-vlvxor");
    			add_location(div1, file$2, 103, 0, 2587);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, section0);
    			if (if_block0) if_block0.m(section0, null);
    			append_dev(div0, t0);
    			append_dev(div0, section1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(section1, null);
    			}

    			append_dev(div0, t1);
    			append_dev(div0, section2);
    			if_block2.m(section2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*completed*/ ctx[2] < 4) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(section0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(section1, null);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(section2, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				div0_intro = create_in_transition(div0, fly, { delay: 250, y: 500, duration: 250 });
    				div0_intro.start();
    			});

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { duration: 200 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fly, { y: 50, duration: 200 });
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 250, duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if_block2.d();
    			if (detaching && div0_outro) div0_outro.end();
    			if (detaching && div1_outro) div1_outro.end();
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
    	let { tabIndex } = $$props;
    	let completed = 0;
    	let UserData = {};
    	let cancelPressed = false;

    	switch (tabIndex) {
    		case 0:
    			UserData = {
    				Name: { First: "", Last: "" },
    				Student: { Course: "", Year: "", Section: "" },
    				Images: { First: "", Second: "" },
    				LoggedIn: false
    			};
    			break;
    		case 1:
    			UserData = {
    				Name: { First: "", Last: "" },
    				Images: { First: "", Second: "" },
    				Occupation: "",
    				LoggedIn: ""
    			};
    			break;
    	}

    	function closePanel() {
    		$$invalidate(4, cancelPressed = !cancelPressed);
    	}

    	function closeConfirm() {
    		$$invalidate(0, addPressed = !addPressed);
    	}

    	function next() {
    		if (completed == 1 && (UserData.Name.First == "" || UserData.Name.Last == "")) $$invalidate(2, completed = 1); else if (completed == 2 && tabIndex == 0 && (UserData.Student.Course == "" || UserData.Student.Year == "" || UserData.Student.Section == "")) $$invalidate(2, completed = 2); else if (completed == 2 && tabIndex == 1 && UserData.Occupation == "") $$invalidate(2, completed = 2); else if (!(completed >= 3)) $$invalidate(2, completed += 1);
    	}

    	function previous() {
    		$$invalidate(4, cancelPressed = false);
    		if (!(completed <= 0)) $$invalidate(2, completed -= 1);
    	}

    	function finish() {

    		if (completed == 3 && (UserData.Images.First != "" || UserData.Images.Second != "")) {
    			switch (tabIndex) {
    				case 0:
    					socket.emit("student-data-post-request", UserData);
    					break;
    				case 1:
    					socket.emit("employee-data-post-request", UserData);
    					break;
    			}
    		}
    	}

    	socket.on("user-data-post-status", confirmation => {
    		switch (confirmation) {
    			case 0:
    				// False or Fail
    				$$invalidate(2, completed = 6);
    				break;
    			case 1:
    				// True or Success
    				$$invalidate(2, completed = 5);
    				break;
    		}
    	});

    	onDestroy(() => {
    		($$invalidate(4, cancelPressed = undefined));
    	});

    	const writable_props = ['addPressed', 'tabIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddScreen> was created with unknown prop '${key}'`);
    	});

    	function formaddpage2_UserData_binding(value) {
    		UserData = value;
    		$$invalidate(3, UserData);
    	}

    	function formaddpage3_UserData_binding(value) {
    		UserData = value;
    		$$invalidate(3, UserData);
    	}

    	function formaddpage4_UserData_binding(value) {
    		UserData = value;
    		$$invalidate(3, UserData);
    	}

    	function formcompletepage_addPressed_binding(value) {
    		addPressed = value;
    		$$invalidate(0, addPressed);
    	}

    	$$self.$$set = $$props => {
    		if ('addPressed' in $$props) $$invalidate(0, addPressed = $$props.addPressed);
    		if ('tabIndex' in $$props) $$invalidate(1, tabIndex = $$props.tabIndex);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		fly,
    		fade,
    		FormAddPage1,
    		FormAddPage2,
    		FormAddPage3,
    		FormAddPage4,
    		FormCompletePage,
    		addPressed,
    		tabIndex,
    		completed,
    		UserData,
    		cancelPressed,
    		closePanel,
    		closeConfirm,
    		next,
    		previous,
    		finish
    	});

    	$$self.$inject_state = $$props => {
    		if ('addPressed' in $$props) $$invalidate(0, addPressed = $$props.addPressed);
    		if ('tabIndex' in $$props) $$invalidate(1, tabIndex = $$props.tabIndex);
    		if ('completed' in $$props) $$invalidate(2, completed = $$props.completed);
    		if ('UserData' in $$props) $$invalidate(3, UserData = $$props.UserData);
    		if ('cancelPressed' in $$props) $$invalidate(4, cancelPressed = $$props.cancelPressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		addPressed,
    		tabIndex,
    		completed,
    		UserData,
    		cancelPressed,
    		closePanel,
    		closeConfirm,
    		next,
    		previous,
    		finish,
    		formaddpage2_UserData_binding,
    		formaddpage3_UserData_binding,
    		formaddpage4_UserData_binding,
    		formcompletepage_addPressed_binding
    	];
    }

    class AddScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { addPressed: 0, tabIndex: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddScreen",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*addPressed*/ ctx[0] === undefined && !('addPressed' in props)) {
    			console.warn("<AddScreen> was created without expected prop 'addPressed'");
    		}

    		if (/*tabIndex*/ ctx[1] === undefined && !('tabIndex' in props)) {
    			console.warn("<AddScreen> was created without expected prop 'tabIndex'");
    		}
    	}

    	get addPressed() {
    		throw new Error("<AddScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addPressed(value) {
    		throw new Error("<AddScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabIndex() {
    		throw new Error("<AddScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabIndex(value) {
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
    	let p0;
    	let t2;
    	let p1;
    	let t3;

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
    			p0 = element("p");
    			p0.textContent = "\"We're always watching.\"";
    			t2 = space();
    			p1 = element("p");
    			t3 = text(/*statusMessage*/ ctx[0]);
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$1, 24, 4, 589);
    			attr_dev(path1, "class", "eye svelte-120a2cg");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$1, 25, 4, 2634);
    			attr_dev(path2, "class", "eye svelte-120a2cg");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$1, 26, 4, 3089);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$1, 27, 4, 3540);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$1, 30, 4, 9019);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$1, 31, 4, 9053);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$1, 29, 4, 8891);
    			add_location(defs, file$1, 28, 4, 8879);
    			attr_dev(svg, "width", "60");
    			attr_dev(svg, "height", "68");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-120a2cg");
    			add_location(svg, file$1, 23, 2, 488);
    			attr_dev(p0, "class", "subtitle svelte-120a2cg");
    			add_location(p0, file$1, 35, 2, 9142);
    			attr_dev(p1, "class", "svelte-120a2cg");
    			add_location(p1, file$1, 36, 2, 9194);
    			attr_dev(div, "class", "svelte-120a2cg");
    			add_location(div, file$1, 22, 0, 479);
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
    			append_dev(div, p0);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*statusMessage*/ 1) set_data_dev(t3, /*statusMessage*/ ctx[0]);
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
    		$$invalidate(0, statusMessage = undefined);
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
    			attr_dev(main, "class", "svelte-1xdv1o7");
    			toggle_class(main, "blur", /*addPressed*/ ctx[1]);
    			add_location(main, file, 17, 1, 525);
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

    	let addscreen_props = { tabIndex: /*tabIndex*/ ctx[0] };

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
    			if (dirty & /*tabIndex*/ 1) addscreen_changes.tabIndex = /*tabIndex*/ ctx[0];

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
