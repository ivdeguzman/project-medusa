
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
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

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const sidebar = writable(false);
    const addToggle = writable(false);
    const addToggleComplete = writable(false);
    const loadingComplete = writable(false);
    const destroyComponent = writable(false);
    const raspberryConnected = writable(false);

    // State 0 - Welcome Screen
    // State 1 - User Name Info
    // State 2 - Occupation/Student Info
    // State 3 - Image Selection Window
    // State 4 - Post Status
    // State 5 - Success
    // State 6 - Failure
    // State 10 - Edit Screen
    const subWindowStatus = writable(0);

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

    /* src\components\Sidebar.svelte generated by Svelte v3.44.2 */
    const file$l = "src\\components\\Sidebar.svelte";

    // (29:2) {#if $destroyComponent == true}
    function create_if_block$c(ctx) {
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
    	let button2;
    	let svg2;
    	let path3;
    	let div0_intro;
    	let t2;
    	let a;
    	let t4;
    	let div2;
    	let div1;
    	let div1_title_value;
    	let div2_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
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
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path3 = svg_element("path");
    			t2 = space();
    			a = element("a");
    			a.textContent = "Rickroll";
    			t4 = space();
    			div2 = element("div");
    			div1 = element("div");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "clip-rule", "evenodd");
    			attr_dev(path0, "d", "M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z");
    			add_location(path0, file$l, 38, 10, 1179);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z");
    			add_location(path1, file$l, 43, 10, 1378);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "16");
    			attr_dev(svg0, "height", "16");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			attr_dev(svg0, "class", "svelte-1xp49st");
    			add_location(svg0, file$l, 32, 8, 1030);
    			attr_dev(button0, "class", "w-full h-14 flex justify-center items-center svelte-1xp49st");
    			add_location(button0, file$l, 31, 6, 933);
    			attr_dev(path2, "d", "M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z");
    			add_location(path2, file$l, 58, 10, 1883);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "16");
    			attr_dev(svg1, "height", "16");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			attr_dev(svg1, "class", "svelte-1xp49st");
    			add_location(svg1, file$l, 52, 8, 1734);
    			attr_dev(button1, "class", "w-full h-14 flex justify-center items-center svelte-1xp49st");
    			add_location(button1, file$l, 51, 6, 1637);
    			attr_dev(path3, "fill-rule", "evenodd");
    			attr_dev(path3, "clip-rule", "evenodd");
    			attr_dev(path3, "d", "M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z");
    			add_location(path3, file$l, 71, 10, 2631);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "16");
    			attr_dev(svg2, "height", "16");
    			attr_dev(svg2, "viewBox", "0 0 16 16");
    			attr_dev(svg2, "class", "svelte-1xp49st");
    			add_location(svg2, file$l, 65, 8, 2482);
    			attr_dev(button2, "class", "w-full h-14 flex justify-center items-center svelte-1xp49st");
    			add_location(button2, file$l, 64, 6, 2385);
    			add_location(div0, file$l, 29, 4, 862);
    			attr_dev(a, "href", "https://youtu.be/o-YBDTqX_ZU");
    			attr_dev(a, "class", "hidden");
    			attr_dev(a, "id", "rickroll");
    			add_location(a, file$l, 79, 4, 2844);
    			attr_dev(div1, "class", "status-icon h-5 w-5 rounded-full svelte-1xp49st");

    			attr_dev(div1, "title", div1_title_value = /*$raspberryConnected*/ ctx[1]
    			? "Device connected"
    			: "Device not connected");

    			toggle_class(div1, "connected", /*$raspberryConnected*/ ctx[1]);
    			toggle_class(div1, "disconnected", !/*$raspberryConnected*/ ctx[1]);
    			add_location(div1, file$l, 81, 6, 3051);
    			attr_dev(div2, "class", "w-14 h-14 flex justify-center items-center bg-transparent");
    			add_location(div2, file$l, 80, 4, 2930);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(div0, t0);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path2);
    			append_dev(div0, t1);
    			append_dev(div0, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path3);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*shutdownPrompt*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*maximizeWindow*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*minimizeWindow*/ ctx[3], false, false, false),
    					listen_dev(div1, "click", /*easterEgg*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$raspberryConnected*/ 2 && div1_title_value !== (div1_title_value = /*$raspberryConnected*/ ctx[1]
    			? "Device connected"
    			: "Device not connected")) {
    				attr_dev(div1, "title", div1_title_value);
    			}

    			if (dirty & /*$raspberryConnected*/ 2) {
    				toggle_class(div1, "connected", /*$raspberryConnected*/ ctx[1]);
    			}

    			if (dirty & /*$raspberryConnected*/ 2) {
    				toggle_class(div1, "disconnected", !/*$raspberryConnected*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fade, { duration: 200 });
    					div0_intro.start();
    				});
    			}

    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fade, { delay: 400, duration: 200 });
    					div2_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(29:2) {#if $destroyComponent == true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let section;
    	let if_block = /*$destroyComponent*/ ctx[0] == true && create_if_block$c(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (if_block) if_block.c();
    			set_style(section, "-webkit-app-region", "drag");
    			set_style(section, "background", "#242424");
    			attr_dev(section, "class", "z-50 flex flex-col w-14 justify-between align-center");
    			add_location(section, file$l, 27, 0, 696);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			if (if_block) if_block.m(section, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$destroyComponent*/ ctx[0] == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$destroyComponent*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$c(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(section, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $destroyComponent;
    	let $raspberryConnected;
    	validate_store(destroyComponent, 'destroyComponent');
    	component_subscribe($$self, destroyComponent, $$value => $$invalidate(0, $destroyComponent = $$value));
    	validate_store(raspberryConnected, 'raspberryConnected');
    	component_subscribe($$self, raspberryConnected, $$value => $$invalidate(1, $raspberryConnected = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	const { ipcRenderer } = require("electron");

    	function shutdownPrompt() {
    		ipcRenderer.send("shutdown-prompt");
    	}

    	function minimizeWindow() {
    		ipcRenderer.send("minimize-window");
    	}

    	function maximizeWindow() {
    		ipcRenderer.send("maximize-window");
    	}

    	ipcRenderer.on("raspberry-is-online", (event, res) => {
    		if (res == true) {
    			raspberryConnected.set(true);
    		} else {
    			raspberryConnected.set(false);
    		}
    	});

    	let easterEgg = () => {
    		document.getElementById("rickroll").click();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		raspberryConnected,
    		destroyComponent,
    		fade,
    		shutdownPrompt,
    		minimizeWindow,
    		maximizeWindow,
    		easterEgg,
    		$destroyComponent,
    		$raspberryConnected
    	});

    	$$self.$inject_state = $$props => {
    		if ('easterEgg' in $$props) $$invalidate(5, easterEgg = $$props.easterEgg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$destroyComponent,
    		$raspberryConnected,
    		shutdownPrompt,
    		minimizeWindow,
    		maximizeWindow,
    		easterEgg
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    const pageIndex = writable(0);
    const pageTitle = writable("Students");

    const axios$3 = require("axios").default;

    const newProfile = writable("");
    const editProfile = writable("");
    const selectedProfile = writable("");
    const selectedProfileCurrentIndex = writable(0);
    const selectedProfileIndices = derived(
    	[selectedProfile, selectedProfileCurrentIndex],
    	async () => {
    		let url;
    		if (get_store_value(pageIndex) == 0)
    			url = `http://localhost:14500/api/student/attendance/get/${
				get_store_value(selectedProfile)._id
			}/count`;
    		else
    			url = `http://localhost:14500/api/employee/attendance/get/${
				get_store_value(selectedProfile)._id
			}/count`;
    		try {
    			let data = await axios$3.get(url);
    			return data.data;
    		} catch {
    			return {
    				message:
    					"There is a problem with the database, please try again later.",
    			};
    		}
    	}
    );
    const selectedProfileData = derived(
    	[selectedProfileIndices, selectedProfileCurrentIndex],
    	async () => {
    		let url;
    		if (get_store_value(pageIndex) == 0)
    			url = `http://localhost:14500/api/student/attendance/get/${
				get_store_value(selectedProfile)._id
			}/list/${get_store_value(selectedProfileCurrentIndex)}`;
    		else
    			url = `http://localhost:14500/api/employee/attendance/get/${
				get_store_value(selectedProfile)._id
			}/list/${get_store_value(selectedProfileCurrentIndex)}`;

    		try {
    			let data = await axios$3.get(url);
    			return data.data;
    		} catch {
    			return {
    				message:
    					"There is a problem with the database, please try again later.",
    			};
    		}
    	}
    );

    const axios$2 = require("axios").default;

    const searchValue = writable("");
    const searchIndex = writable(0);
    const searchResults = derived([searchValue, searchIndex], async () => {
    	let url;
    	if (get_store_value(pageIndex) == 0) url = "http://localhost:14500/api/student";
    	else url = "http://localhost:14500/api/employee";

    	try {
    		let data = await axios$2.post(`${url}/get/search/`, {
    			Search: get_store_value(searchValue),
    			Index: get_store_value(searchIndex),
    		});
    		return data.data;
    	} catch {
    		return {
    			message: "There is a problem with the database, please try again later.",
    		};
    	}
    });

    /* src\components\Header.svelte generated by Svelte v3.44.2 */
    const file$k = "src\\components\\Header.svelte";

    function create_fragment$k(ctx) {
    	let div3;
    	let div0;
    	let button0;
    	let svg;
    	let path;
    	let t0;
    	let div1;
    	let h10;
    	let span;
    	let t2;
    	let t3;
    	let h11;
    	let t4;
    	let t5;
    	let div2;
    	let button1;
    	let t7;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			h10 = element("h1");
    			span = element("span");
    			span.textContent = "P";
    			t2 = text(":MEDUSA");
    			t3 = space();
    			h11 = element("h1");
    			t4 = text(/*$pageTitle*/ ctx[0]);
    			t5 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "Students";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "Employees";
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z");
    			add_location(path, file$k, 29, 8, 958);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "w-6 h-6");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$k, 28, 6, 852);
    			attr_dev(button0, "class", "px-2 py-2 rounded-full svelte-1wcqngt");
    			add_location(button0, file$k, 27, 4, 774);
    			attr_dev(div0, "class", "md:hidden flex justify-start items-center svelte-1wcqngt");
    			add_location(div0, file$k, 26, 2, 713);
    			attr_dev(span, "class", "custom-text-blue bg-transparent");
    			add_location(span, file$k, 34, 123, 1369);
    			attr_dev(h10, "class", "md:block hidden custom-bg-white flex justify-start items-center font-light text-4xl md:ml-5 bg-transparent");
    			add_location(h10, file$k, 34, 4, 1250);
    			attr_dev(h11, "class", "md:hidden block custom-bg-white flex justify-start items-center font-light text-4xl md:ml-5 bg-transparent");
    			add_location(h11, file$k, 35, 4, 1441);
    			attr_dev(div1, "class", "flex items-center svelte-1wcqngt");
    			add_location(div1, file$k, 33, 2, 1213);
    			attr_dev(button1, "class", "mx-1 rounded-xl w-36 py-1 font-light text-2xl svelte-1wcqngt");
    			toggle_class(button1, "active", /*$pageIndex*/ ctx[1] == 0);
    			add_location(button1, file$k, 38, 4, 1675);
    			attr_dev(button2, "class", "mx-1 rounded-xl w-36 py-1 font-light text-2xl svelte-1wcqngt");
    			toggle_class(button2, "active", /*$pageIndex*/ ctx[1] == 1);
    			add_location(button2, file$k, 39, 4, 1822);
    			attr_dev(div2, "class", "custom-bg-white bg-transparent place-self-center md:block hidden svelte-1wcqngt");
    			add_location(div2, file$k, 37, 2, 1591);
    			attr_dev(div3, "class", "header custom-bg-white w-full h-16 grid md:px-0 px-6 svelte-1wcqngt");
    			add_location(div3, file$k, 25, 0, 643);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, h10);
    			append_dev(h10, span);
    			append_dev(h10, t2);
    			append_dev(div1, t3);
    			append_dev(div1, h11);
    			append_dev(h11, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(div2, t7);
    			append_dev(div2, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*sidebarActiveToggle*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$pageTitle*/ 1) set_data_dev(t4, /*$pageTitle*/ ctx[0]);

    			if (dirty & /*$pageIndex*/ 2) {
    				toggle_class(button1, "active", /*$pageIndex*/ ctx[1] == 0);
    			}

    			if (dirty & /*$pageIndex*/ 2) {
    				toggle_class(button2, "active", /*$pageIndex*/ ctx[1] == 1);
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $sidebar;
    	let $searchValue;
    	let $searchIndex;
    	let $editProfile;
    	let $selectedProfile;
    	let $pageTitle;
    	let $pageIndex;
    	validate_store(sidebar, 'sidebar');
    	component_subscribe($$self, sidebar, $$value => $$invalidate(6, $sidebar = $$value));
    	validate_store(searchValue, 'searchValue');
    	component_subscribe($$self, searchValue, $$value => $$invalidate(7, $searchValue = $$value));
    	validate_store(searchIndex, 'searchIndex');
    	component_subscribe($$self, searchIndex, $$value => $$invalidate(8, $searchIndex = $$value));
    	validate_store(editProfile, 'editProfile');
    	component_subscribe($$self, editProfile, $$value => $$invalidate(9, $editProfile = $$value));
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(10, $selectedProfile = $$value));
    	validate_store(pageTitle, 'pageTitle');
    	component_subscribe($$self, pageTitle, $$value => $$invalidate(0, $pageTitle = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(1, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

    	let pageSwitch = num => {
    		set_store_value(pageIndex, $pageIndex = num, $pageIndex);

    		switch (num) {
    			case 0:
    				set_store_value(pageTitle, $pageTitle = "Students", $pageTitle);
    				break;
    			case 1:
    				set_store_value(pageTitle, $pageTitle = "Employees", $pageTitle);
    				break;
    		}

    		set_store_value(selectedProfile, $selectedProfile = "", $selectedProfile);
    		set_store_value(editProfile, $editProfile = "", $editProfile);
    		set_store_value(searchIndex, $searchIndex = 0, $searchIndex);
    		set_store_value(searchValue, $searchValue = "", $searchValue);
    	};

    	let sidebarActiveToggle = () => {
    		set_store_value(sidebar, $sidebar = !$sidebar, $sidebar);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => pageSwitch(0);
    	const click_handler_1 = () => pageSwitch(1);

    	$$self.$capture_state = () => ({
    		pageIndex,
    		pageTitle,
    		selectedProfile,
    		editProfile,
    		searchIndex,
    		searchValue,
    		sidebar,
    		pageSwitch,
    		sidebarActiveToggle,
    		$sidebar,
    		$searchValue,
    		$searchIndex,
    		$editProfile,
    		$selectedProfile,
    		$pageTitle,
    		$pageIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('pageSwitch' in $$props) $$invalidate(2, pageSwitch = $$props.pageSwitch);
    		if ('sidebarActiveToggle' in $$props) $$invalidate(3, sidebarActiveToggle = $$props.sidebarActiveToggle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$pageTitle,
    		$pageIndex,
    		pageSwitch,
    		sidebarActiveToggle,
    		click_handler,
    		click_handler_1
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\components\SideMenu.svelte generated by Svelte v3.44.2 */
    const file$j = "src\\components\\SideMenu.svelte";

    function create_fragment$j(ctx) {
    	let div3;
    	let div0;
    	let div0_transition;
    	let t0;
    	let div2;
    	let div1;
    	let h1;
    	let span;
    	let t2;
    	let t3;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			span = element("span");
    			span.textContent = "P";
    			t2 = text(":Medusa");
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Students";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Employees";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "Add";
    			attr_dev(div0, "class", "fixed z-40 w-screen h-screen bg-black opacity-20");
    			add_location(div0, file$j, 33, 2, 881);
    			attr_dev(span, "class", "bg-transparent custom-text-blue");
    			add_location(span, file$j, 36, 108, 1340);
    			attr_dev(h1, "class", "px-5 font-light flex justify-center items-center text-4xl h-16 text-center bg-transparent svelte-e5j5rd");
    			add_location(h1, file$j, 36, 6, 1238);
    			attr_dev(button0, "class", "text-2xl text-left font-light pl-5 mb-3 mx-5 h-10 rounded-xl mt-5 svelte-e5j5rd");
    			add_location(button0, file$j, 37, 6, 1414);
    			attr_dev(button1, "class", "text-2xl text-left font-light pl-5 mb-3 mx-5 h-10 rounded-xl svelte-e5j5rd");
    			add_location(button1, file$j, 38, 6, 1552);
    			attr_dev(div1, "class", "flex flex-col bg-transparent");
    			add_location(div1, file$j, 35, 4, 1188);
    			attr_dev(button2, "class", "text-2xl text-left font-light pl-5 mb-3 mx-5 h-10 rounded-xl mb-5 svelte-e5j5rd");
    			add_location(button2, file$j, 40, 4, 1696);
    			attr_dev(div2, "class", "fixed z-50 w-96 h-screen ml-14 flex flex-col justify-between");
    			set_style(div2, "background", "#242424");
    			toggle_class(div2, "show", /*$sidebar*/ ctx[0]);
    			add_location(div2, file$j, 34, 2, 1015);
    			attr_dev(div3, "class", "md:hidden");
    			add_location(div3, file$j, 32, 0, 854);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(h1, span);
    			append_dev(h1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(div2, t7);
    			append_dev(div2, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*sidebarActiveToggle*/ ctx[2], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", /*switchState*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$sidebar*/ 1) {
    				toggle_class(div2, "show", /*$sidebar*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 150 }, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { x: -250, duration: 150 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 150 }, false);
    			div0_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { x: -250, duration: 150 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $addToggle;
    	let $sidebar;
    	let $searchValue;
    	let $searchIndex;
    	let $editProfile;
    	let $selectedProfile;
    	let $pageTitle;
    	let $pageIndex;
    	validate_store(addToggle, 'addToggle');
    	component_subscribe($$self, addToggle, $$value => $$invalidate(6, $addToggle = $$value));
    	validate_store(sidebar, 'sidebar');
    	component_subscribe($$self, sidebar, $$value => $$invalidate(0, $sidebar = $$value));
    	validate_store(searchValue, 'searchValue');
    	component_subscribe($$self, searchValue, $$value => $$invalidate(7, $searchValue = $$value));
    	validate_store(searchIndex, 'searchIndex');
    	component_subscribe($$self, searchIndex, $$value => $$invalidate(8, $searchIndex = $$value));
    	validate_store(editProfile, 'editProfile');
    	component_subscribe($$self, editProfile, $$value => $$invalidate(9, $editProfile = $$value));
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(10, $selectedProfile = $$value));
    	validate_store(pageTitle, 'pageTitle');
    	component_subscribe($$self, pageTitle, $$value => $$invalidate(11, $pageTitle = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(12, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SideMenu', slots, []);

    	let pageSwitch = num => {
    		set_store_value(pageIndex, $pageIndex = num, $pageIndex);

    		switch (num) {
    			case 0:
    				set_store_value(pageTitle, $pageTitle = "Students", $pageTitle);
    				set_store_value(sidebar, $sidebar = false, $sidebar);
    				break;
    			case 1:
    				set_store_value(pageTitle, $pageTitle = "Employees", $pageTitle);
    				set_store_value(sidebar, $sidebar = false, $sidebar);
    				break;
    		}

    		set_store_value(selectedProfile, $selectedProfile = "", $selectedProfile);
    		set_store_value(editProfile, $editProfile = "", $editProfile);
    		set_store_value(searchIndex, $searchIndex = 0, $searchIndex);
    		set_store_value(searchValue, $searchValue = "", $searchValue);
    	};

    	let sidebarActiveToggle = () => {
    		set_store_value(sidebar, $sidebar = !$sidebar, $sidebar);
    	};

    	let switchState = () => {
    		set_store_value(addToggle, $addToggle = !$addToggle, $addToggle);
    		sidebarActiveToggle();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SideMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => pageSwitch(0);
    	const click_handler_1 = () => pageSwitch(1);

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		pageIndex,
    		pageTitle,
    		selectedProfile,
    		editProfile,
    		searchIndex,
    		searchValue,
    		sidebar,
    		addToggle,
    		pageSwitch,
    		sidebarActiveToggle,
    		switchState,
    		$addToggle,
    		$sidebar,
    		$searchValue,
    		$searchIndex,
    		$editProfile,
    		$selectedProfile,
    		$pageTitle,
    		$pageIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('pageSwitch' in $$props) $$invalidate(1, pageSwitch = $$props.pageSwitch);
    		if ('sidebarActiveToggle' in $$props) $$invalidate(2, sidebarActiveToggle = $$props.sidebarActiveToggle);
    		if ('switchState' in $$props) $$invalidate(3, switchState = $$props.switchState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$sidebar,
    		pageSwitch,
    		sidebarActiveToggle,
    		switchState,
    		click_handler,
    		click_handler_1
    	];
    }

    class SideMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideMenu",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\components\AddButton.svelte generated by Svelte v3.44.2 */
    const file$i = "src\\components\\AddButton.svelte";

    function create_fragment$i(ctx) {
    	let button;
    	let svg;
    	let line0;
    	let line1;
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
    			add_location(line0, file$i, 19, 4, 522);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$i, 25, 4, 609);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "#efefef");
    			attr_dev(svg, "stroke-width", "1.25");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "w-14 h-14 bg-transparent");
    			add_location(svg, file$i, 9, 2, 278);
    			attr_dev(button, "class", "md:grid hidden fixed right-6 bottom-5 custom-bg-blue w-16 h-16 z-30 rounded-full place-items-center svelte-sivxj2");
    			add_location(button, file$i, 8, 0, 135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, line0);
    			append_dev(svg, line1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*switchState*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $addToggle;
    	validate_store(addToggle, 'addToggle');
    	component_subscribe($$self, addToggle, $$value => $$invalidate(1, $addToggle = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AddButton', slots, []);

    	let switchState = () => {
    		set_store_value(addToggle, $addToggle = !$addToggle, $addToggle);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ addToggle, switchState, $addToggle });

    	$$self.$inject_state = $$props => {
    		if ('switchState' in $$props) $$invalidate(0, switchState = $$props.switchState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [switchState];
    }

    class AddButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddButton",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    const axios$1 = require("axios").default;

    let axiosGet$1 = async (url) => {
    	try {
    		const data = await axios$1.get(url);
    		return data.data;
    	} catch {
    		return {
    			message: "There is a problem with the database, please try again later.",
    		};
    	}
    };

    const employeeCurrentIndex = writable(1);
    const employeeData = derived(
    	[employeeCurrentIndex, pageIndex, selectedProfile, addToggleComplete],
    	async () => {
    		let data = await axiosGet$1(
    			`http://localhost:14500/api/employee/get/${get_store_value(employeeCurrentIndex)}`
    		);
    		return data;
    	}
    );
    const employeeTotalIndexCount = derived(
    	[employeeCurrentIndex, pageIndex, selectedProfile, addToggleComplete],
    	async () => {
    		let data = await axiosGet$1(`http://localhost:14500/api/employee/get/`);
    		return data;
    	}
    );

    const axios = require("axios").default;

    let axiosGet = async (url) => {
    	try {
    		const data = await axios.get(url);
    		return data.data;
    	} catch {
    		return {
    			message: "There is a problem with the database, please try again later.",
    		};
    	}
    };

    const studentCurrentIndex = writable(1);
    const studentData = derived(
    	[studentCurrentIndex, pageIndex, selectedProfile, addToggleComplete],
    	async () => {
    		let data = await axiosGet(
    			`http://localhost:14500/api/student/get/${get_store_value(studentCurrentIndex)}`
    		);
    		return data;
    	}
    );
    const studentTotalIndexCount = derived(
    	[studentCurrentIndex, pageIndex, selectedProfile, addToggleComplete],
    	async () => {
    		let data = await axiosGet(`http://localhost:14500/api/student/get`);
    		return data;
    	}
    );

    /* src\components\Navigation.svelte generated by Svelte v3.44.2 */

    const file$h = "src\\components\\Navigation.svelte";

    // (1:0) <script>    import { fade }
    function create_catch_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>    import { fade }",
    		ctx
    	});

    	return block;
    }

    // (79:28)     {#if value != 0 && value != null && value != undefined}
    function create_then_block$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*value*/ ctx[15] != 0 && /*value*/ ctx[15] != null && /*value*/ ctx[15] != undefined && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*value*/ ctx[15] != 0 && /*value*/ ctx[15] != null && /*value*/ ctx[15] != undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*endIndex*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$b(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(79:28)     {#if value != 0 && value != null && value != undefined}",
    		ctx
    	});

    	return block;
    }

    // (80:2) {#if value != 0 && value != null && value != undefined}
    function create_if_block$b(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let t4_value = /*value*/ ctx[15] + "";
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let button1_disabled_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Back");
    			t1 = space();
    			p = element("p");
    			t2 = text(/*currentIndex*/ ctx[0]);
    			t3 = text(" out of ");
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Next");
    			button0.disabled = button0_disabled_value = /*currentIndex*/ ctx[0] <= 1;
    			attr_dev(button0, "class", "custom-bg-white mx-2 font-light rounded-full py-0.5 px-4 svelte-18uhios");
    			add_location(button0, file$h, 81, 6, 2824);
    			attr_dev(p, "class", "custom-bg-white mx-2 font-light rounded-full py-2 px-6 svelte-18uhios");
    			add_location(p, file$h, 82, 8, 2965);
    			button1.disabled = button1_disabled_value = /*currentIndex*/ ctx[0] == /*value*/ ctx[15];
    			attr_dev(button1, "class", "custom-bg-white mx-2 font-light rounded-full py-0.5 px-4 svelte-18uhios");
    			add_location(button1, file$h, 83, 6, 3072);
    			attr_dev(div, "class", "fixed pl-14 bottom-5 w-full flex justify-center items-center bg-transparent z-20");
    			add_location(div, file$h, 80, 4, 2653);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, t6);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*back*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*next*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*currentIndex*/ 1 && button0_disabled_value !== (button0_disabled_value = /*currentIndex*/ ctx[0] <= 1)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (!current || dirty & /*currentIndex*/ 1) set_data_dev(t2, /*currentIndex*/ ctx[0]);
    			if ((!current || dirty & /*endIndex*/ 2) && t4_value !== (t4_value = /*value*/ ctx[15] + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty & /*currentIndex, endIndex*/ 3 && button1_disabled_value !== (button1_disabled_value = /*currentIndex*/ ctx[0] == /*value*/ ctx[15])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, { delay: 750, duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(80:2) {#if value != 0 && value != null && value != undefined}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { fade }
    function create_pending_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0) <script>    import { fade }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*endIndex*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*endIndex*/ 2 && promise !== (promise = /*endIndex*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $employeeCurrentIndex;
    	let $studentCurrentIndex;
    	let $pageIndex;
    	let $searchIndex;
    	let $searchValue;
    	let $selectedProfileCurrentIndex;
    	let $selectedProfile;
    	let $employeeTotalIndexCount;
    	let $studentTotalIndexCount;
    	let $searchResults;
    	let $selectedProfileIndices;
    	validate_store(employeeCurrentIndex, 'employeeCurrentIndex');
    	component_subscribe($$self, employeeCurrentIndex, $$value => $$invalidate(4, $employeeCurrentIndex = $$value));
    	validate_store(studentCurrentIndex, 'studentCurrentIndex');
    	component_subscribe($$self, studentCurrentIndex, $$value => $$invalidate(5, $studentCurrentIndex = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(6, $pageIndex = $$value));
    	validate_store(searchIndex, 'searchIndex');
    	component_subscribe($$self, searchIndex, $$value => $$invalidate(7, $searchIndex = $$value));
    	validate_store(searchValue, 'searchValue');
    	component_subscribe($$self, searchValue, $$value => $$invalidate(8, $searchValue = $$value));
    	validate_store(selectedProfileCurrentIndex, 'selectedProfileCurrentIndex');
    	component_subscribe($$self, selectedProfileCurrentIndex, $$value => $$invalidate(9, $selectedProfileCurrentIndex = $$value));
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(10, $selectedProfile = $$value));
    	validate_store(employeeTotalIndexCount, 'employeeTotalIndexCount');
    	component_subscribe($$self, employeeTotalIndexCount, $$value => $$invalidate(11, $employeeTotalIndexCount = $$value));
    	validate_store(studentTotalIndexCount, 'studentTotalIndexCount');
    	component_subscribe($$self, studentTotalIndexCount, $$value => $$invalidate(12, $studentTotalIndexCount = $$value));
    	validate_store(searchResults, 'searchResults');
    	component_subscribe($$self, searchResults, $$value => $$invalidate(13, $searchResults = $$value));
    	validate_store(selectedProfileIndices, 'selectedProfileIndices');
    	component_subscribe($$self, selectedProfileIndices, $$value => $$invalidate(14, $selectedProfileIndices = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navigation', slots, []);
    	let currentIndex, endIndex;

    	let back = () => {
    		if ($selectedProfile != "") {
    			selectedProfileCurrentIndex.set($selectedProfileCurrentIndex - 1);
    			$$invalidate(0, currentIndex = $selectedProfileCurrentIndex - 1);
    		} else if ($searchValue != "") {
    			searchIndex.set($searchIndex - 1);
    			$$invalidate(0, currentIndex = $searchIndex - 1);
    		} else {
    			switch ($pageIndex) {
    				case 0:
    					studentCurrentIndex.set($studentCurrentIndex - 1);
    					$$invalidate(0, currentIndex = $studentCurrentIndex);
    					break;
    				case 1:
    					employeeCurrentIndex.set($employeeCurrentIndex - 1);
    					$$invalidate(0, currentIndex = $employeeCurrentIndex);
    					break;
    			}
    		}
    	};

    	let next = () => {
    		if ($selectedProfile != "") {
    			selectedProfileCurrentIndex.set($selectedProfileCurrentIndex + 1);
    			$$invalidate(0, currentIndex = $selectedProfileCurrentIndex + 1);
    		} else if ($searchValue != "") {
    			searchIndex.set($searchIndex + 1);
    			$$invalidate(0, currentIndex = $searchIndex + 1);
    		} else {
    			switch ($pageIndex) {
    				case 0:
    					studentCurrentIndex.set($studentCurrentIndex + 1);
    					$$invalidate(0, currentIndex = $studentCurrentIndex);
    					break;
    				case 1:
    					employeeCurrentIndex.set($employeeCurrentIndex + 1);
    					$$invalidate(0, currentIndex = $employeeCurrentIndex);
    					break;
    			}
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		pageIndex,
    		employeeCurrentIndex,
    		employeeTotalIndexCount,
    		studentCurrentIndex,
    		studentTotalIndexCount,
    		searchValue,
    		searchIndex,
    		searchResults,
    		selectedProfile,
    		selectedProfileCurrentIndex,
    		selectedProfileIndices,
    		currentIndex,
    		endIndex,
    		back,
    		next,
    		$employeeCurrentIndex,
    		$studentCurrentIndex,
    		$pageIndex,
    		$searchIndex,
    		$searchValue,
    		$selectedProfileCurrentIndex,
    		$selectedProfile,
    		$employeeTotalIndexCount,
    		$studentTotalIndexCount,
    		$searchResults,
    		$selectedProfileIndices
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentIndex' in $$props) $$invalidate(0, currentIndex = $$props.currentIndex);
    		if ('endIndex' in $$props) $$invalidate(1, endIndex = $$props.endIndex);
    		if ('back' in $$props) $$invalidate(2, back = $$props.back);
    		if ('next' in $$props) $$invalidate(3, next = $$props.next);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$selectedProfile, $selectedProfileIndices, $selectedProfileCurrentIndex, $searchValue, $searchIndex, $searchResults, $pageIndex, $studentCurrentIndex, $studentTotalIndexCount, $employeeCurrentIndex, $employeeTotalIndexCount*/ 32752) {
    			if ($selectedProfile != "") {
    				$selectedProfileIndices.then(res => {
    					if (res.count != 0) {
    						$$invalidate(0, currentIndex = $selectedProfileCurrentIndex + 1);
    					}

    					$$invalidate(1, endIndex = res.count);
    				});
    			} else if ($searchValue != "" && $searchValue.length >= 2) {
    				$$invalidate(0, currentIndex = $searchIndex + 1);

    				$searchResults.then(res => {
    					$$invalidate(1, endIndex = res.queryIndexCount);
    				});
    			} else if ($pageIndex == 0) {
    				$$invalidate(0, currentIndex = $studentCurrentIndex);

    				$studentTotalIndexCount.then(res => {
    					$$invalidate(1, endIndex = res.count);
    				});
    			} else {
    				$$invalidate(0, currentIndex = $employeeCurrentIndex);

    				$employeeTotalIndexCount.then(res => {
    					$$invalidate(1, endIndex = res.count);
    				});
    			}
    		}
    	};

    	return [
    		currentIndex,
    		endIndex,
    		back,
    		next,
    		$employeeCurrentIndex,
    		$studentCurrentIndex,
    		$pageIndex,
    		$searchIndex,
    		$searchValue,
    		$selectedProfileCurrentIndex,
    		$selectedProfile,
    		$employeeTotalIndexCount,
    		$studentTotalIndexCount,
    		$searchResults,
    		$selectedProfileIndices
    	];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\LoadingScreen.svelte generated by Svelte v3.44.2 */
    const file$g = "src\\components\\LoadingScreen.svelte";

    // (41:0) {#if $destroyComponent == false}
    function create_if_block$a(ctx) {
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
    	let h2;
    	let t4;
    	let h1;
    	let t5;

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
    			h2 = element("h2");
    			h2.textContent = `"${/*funnyQuote*/ ctx[3][Math.floor(Math.random() * /*funnyQuote*/ ctx[3].length)]}"`;
    			t4 = space();
    			h1 = element("h1");
    			t5 = text(/*message*/ ctx[0]);
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$g, 43, 6, 1627);
    			attr_dev(path1, "class", "eye svelte-103m7ig");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$g, 44, 6, 3674);
    			attr_dev(path2, "class", "eye svelte-103m7ig");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$g, 45, 6, 4131);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$g, 46, 6, 4584);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$g, 49, 6, 10069);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$g, 50, 6, 10105);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$g, 48, 6, 9939);
    			add_location(defs, file$g, 47, 6, 9925);
    			attr_dev(svg, "class", "w-40 bg-transparent");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$g, 42, 4, 1519);
    			attr_dev(h2, "class", "text-2xl bg-transparent font-light text-center px-16 custom-text-blue");
    			add_location(h2, file$g, 54, 4, 10202);
    			attr_dev(h1, "class", "text-3xl bg-transparent font-light text-center px-16");
    			set_style(h1, "color", "#efefef");
    			add_location(h1, file$g, 55, 4, 10358);
    			attr_dev(div, "class", "fixed flex justify-center flex-col items-center w-screen h-screen left-0 svelte-103m7ig");
    			toggle_class(div, "hide", /*$loadingComplete*/ ctx[2]);
    			add_location(div, file$g, 41, 2, 1397);
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
    			append_dev(div, h2);
    			append_dev(div, t4);
    			append_dev(div, h1);
    			append_dev(h1, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) set_data_dev(t5, /*message*/ ctx[0]);

    			if (dirty & /*$loadingComplete*/ 4) {
    				toggle_class(div, "hide", /*$loadingComplete*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(41:0) {#if $destroyComponent == false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let if_block_anchor;
    	let if_block = /*$destroyComponent*/ ctx[1] == false && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$destroyComponent*/ ctx[1] == false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $destroyComponent;
    	let $loadingComplete;
    	validate_store(destroyComponent, 'destroyComponent');
    	component_subscribe($$self, destroyComponent, $$value => $$invalidate(1, $destroyComponent = $$value));
    	validate_store(loadingComplete, 'loadingComplete');
    	component_subscribe($$self, loadingComplete, $$value => $$invalidate(2, $loadingComplete = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LoadingScreen', slots, []);
    	const { ipcRenderer } = require("electron");

    	let funnyQuote = [
    		"We're always watching.",
    		"This program has been coded by students!",
    		"Your data is safe, I think.",
    		"Greet your professors with a big smile!",
    		"There are 10 types of people, those who can read binary and the other is you.",
    		"Rest? More like REST API ha... ha... ha...",
    		"Don't worry, I thought of this message long before I was born.",
    		"Please don't fail us. (very please)",
    		"Runs on 100% coffee! (not really though)",
    		"日本語上手ですね。",
    		"I was created in Arch btw.",
    		"Have you ever heard of KFP?",
    		"177013"
    	];

    	let message = "Give us a minute, we're loading the program...";

    	ipcRenderer.on("status-message", (event, res) => {
    		if (res == true) {
    			setTimeout(
    				() => {
    					$$invalidate(0, message = "Loading complete, finalizing setup.");

    					setTimeout(
    						() => {
    							set_store_value(loadingComplete, $loadingComplete = true, $loadingComplete);

    							setTimeout(
    								() => {
    									set_store_value(destroyComponent, $destroyComponent = true, $destroyComponent);
    								},
    								1000
    							);
    						},
    						2000
    					);
    				},
    				8000
    			);
    		} else {
    			$$invalidate(0, message = "Error starting database, please check the service if it is running.");

    			setTimeout(
    				() => {
    					ipcRenderer.send("shutdown-prompt");
    				},
    				2000
    			);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LoadingScreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		loadingComplete,
    		destroyComponent,
    		funnyQuote,
    		message,
    		$destroyComponent,
    		$loadingComplete
    	});

    	$$self.$inject_state = $$props => {
    		if ('funnyQuote' in $$props) $$invalidate(3, funnyQuote = $$props.funnyQuote);
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, $destroyComponent, $loadingComplete, funnyQuote];
    }

    class LoadingScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoadingScreen",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\components\SubWindowForm1.svelte generated by Svelte v3.44.2 */
    const file$f = "src\\components\\SubWindowForm1.svelte";

    function create_fragment$f(ctx) {
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
    	let div_intro;
    	let div_outro;
    	let current;

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
    			p.textContent = "Let's add a profile.";
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$f, 6, 4, 342);
    			attr_dev(path1, "class", "eye");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$f, 7, 4, 2387);
    			attr_dev(path2, "class", "eye");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$f, 8, 4, 2842);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$f, 9, 4, 3293);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$f, 12, 4, 8772);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$f, 13, 4, 8806);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$f, 11, 4, 8644);
    			add_location(defs, file$f, 10, 4, 8632);
    			attr_dev(svg, "class", "h-40 bg-transparent");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$f, 5, 2, 236);
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$f, 17, 2, 8895);
    			attr_dev(div, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div, file$f, 4, 0, 67);
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
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fly, { delay: 200, y: -100, duration: 150 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
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
    	validate_slots('SubWindowForm1', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowForm1> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly });
    	return [];
    }

    class SubWindowForm1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowForm1",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\components\SubWindowForm2.svelte generated by Svelte v3.44.2 */
    const file$e = "src\\components\\SubWindowForm2.svelte";

    function create_fragment$e(ctx) {
    	let div1;
    	let p;
    	let t0;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let input1;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			t0 = text(/*message*/ ctx[1]);
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$e, 17, 2, 672);
    			attr_dev(input0, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center mt-4 svelte-x282d8");
    			set_style(input0, "color", "#efefef");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter first name");
    			add_location(input0, file$e, 19, 4, 817);
    			attr_dev(input1, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center svelte-x282d8");
    			set_style(input1, "color", "#efefef");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Enter last name");
    			add_location(input1, file$e, 20, 4, 1016);
    			attr_dev(div0, "class", "bg-transparent flex flex-col");
    			add_location(div0, file$e, 18, 2, 769);
    			attr_dev(div1, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div1, file$e, 16, 0, 503);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*$newProfile*/ ctx[0].Name.First);
    			append_dev(div0, t2);
    			append_dev(div0, input1);
    			set_input_value(input1, /*$newProfile*/ ctx[0].Name.Last);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*message*/ 2) set_data_dev(t0, /*message*/ ctx[1]);

    			if (dirty & /*$newProfile*/ 1 && input0.value !== /*$newProfile*/ ctx[0].Name.First) {
    				set_input_value(input0, /*$newProfile*/ ctx[0].Name.First);
    			}

    			if (dirty & /*$newProfile*/ 1 && input1.value !== /*$newProfile*/ ctx[0].Name.Last) {
    				set_input_value(input1, /*$newProfile*/ ctx[0].Name.Last);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fly, { delay: 200, y: -100, duration: 150 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
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
    	let $newProfile;
    	let $pageIndex;
    	validate_store(newProfile, 'newProfile');
    	component_subscribe($$self, newProfile, $$value => $$invalidate(0, $newProfile = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(5, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindowForm2', slots, []);
    	let { subWindowButtonDisabled } = $$props;
    	let message;

    	if ($pageIndex == 0) {
    		message = "Who is this wonderful student?";
    	} else message = "Who is this lucky employee?";

    	const writable_props = ['subWindowButtonDisabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowForm2> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$newProfile.Name.First = this.value;
    		newProfile.set($newProfile);
    	}

    	function input1_input_handler() {
    		$newProfile.Name.Last = this.value;
    		newProfile.set($newProfile);
    	}

    	$$self.$$set = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(2, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		newProfile,
    		pageIndex,
    		subWindowButtonDisabled,
    		message,
    		$newProfile,
    		$pageIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(2, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    		if ('message' in $$props) $$invalidate(1, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$newProfile*/ 1) {
    			if ($newProfile.Name.First != "" && $newProfile.Name.Last != "") {
    				$$invalidate(2, subWindowButtonDisabled = false);
    			} else $$invalidate(2, subWindowButtonDisabled = true);
    		}
    	};

    	return [
    		$newProfile,
    		message,
    		subWindowButtonDisabled,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class SubWindowForm2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { subWindowButtonDisabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowForm2",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*subWindowButtonDisabled*/ ctx[2] === undefined && !('subWindowButtonDisabled' in props)) {
    			console.warn("<SubWindowForm2> was created without expected prop 'subWindowButtonDisabled'");
    		}
    	}

    	get subWindowButtonDisabled() {
    		throw new Error("<SubWindowForm2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subWindowButtonDisabled(value) {
    		throw new Error("<SubWindowForm2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SubWindowForm3.svelte generated by Svelte v3.44.2 */
    const file$d = "src\\components\\SubWindowForm3.svelte";

    // (32:30) 
    function create_if_block_1$7(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center mt-4 svelte-x282d8");
    			set_style(input, "color", "#efefef");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter occupation");
    			add_location(input, file$d, 32, 6, 1971);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$newProfile*/ ctx[0].Occupation);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$newProfile*/ 1 && input.value !== /*$newProfile*/ ctx[0].Occupation) {
    				set_input_value(input, /*$newProfile*/ ctx[0].Occupation);
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
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(32:30) ",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if $pageIndex == 0}
    function create_if_block$9(ctx) {
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
    			attr_dev(input0, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center mt-4 svelte-x282d8");
    			set_style(input0, "color", "#efefef");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter course");
    			add_location(input0, file$d, 26, 6, 1044);
    			attr_dev(input1, "class", "font-light w-full mr-2 rounded-full px-5 py-1 mb-2 bg-transparent text-center mt-4 svelte-x282d8");
    			set_style(input1, "color", "#efefef");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "oninput", "this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');");
    			attr_dev(input1, "placeholder", "Enter year");
    			add_location(input1, file$d, 28, 8, 1331);
    			attr_dev(input2, "class", "font-light w-full ml-2 rounded-full px-5 py-1 mb-2 bg-transparent text-center mt-4 svelte-x282d8");
    			set_style(input2, "color", "#efefef");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "oninput", "this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');");
    			attr_dev(input2, "placeholder", "Enter section");
    			add_location(input2, file$d, 29, 8, 1626);
    			attr_dev(div, "class", "bg-transparent flex w-80 justify-between items-center flex-row");
    			add_location(div, file$d, 27, 6, 1245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*$newProfile*/ ctx[0].Student.Course);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input1);
    			set_input_value(input1, /*$newProfile*/ ctx[0].Student.Year);
    			append_dev(div, t1);
    			append_dev(div, input2);
    			set_input_value(input2, /*$newProfile*/ ctx[0].Student.Section);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$newProfile*/ 1 && input0.value !== /*$newProfile*/ ctx[0].Student.Course) {
    				set_input_value(input0, /*$newProfile*/ ctx[0].Student.Course);
    			}

    			if (dirty & /*$newProfile*/ 1 && input1.value !== /*$newProfile*/ ctx[0].Student.Year) {
    				set_input_value(input1, /*$newProfile*/ ctx[0].Student.Year);
    			}

    			if (dirty & /*$newProfile*/ 1 && input2.value !== /*$newProfile*/ ctx[0].Student.Section) {
    				set_input_value(input2, /*$newProfile*/ ctx[0].Student.Section);
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(26:4) {#if $pageIndex == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div1;
    	let p;
    	let t0;
    	let t1;
    	let div0;
    	let div1_intro;
    	let div1_outro;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*$pageIndex*/ ctx[1] == 0) return create_if_block$9;
    		if (/*$pageIndex*/ ctx[1] == 1) return create_if_block_1$7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			t0 = text(/*message*/ ctx[2]);
    			t1 = space();
    			div0 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$d, 23, 2, 870);
    			attr_dev(div0, "class", "bg-transparent flex flex-col");
    			add_location(div0, file$d, 24, 2, 967);
    			attr_dev(div1, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div1, file$d, 22, 0, 701);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*message*/ 4) set_data_dev(t0, /*message*/ ctx[2]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fly, { delay: 200, y: -100, duration: 150 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}

    			if (detaching && div1_outro) div1_outro.end();
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
    	let $newProfile;
    	let $pageIndex;
    	validate_store(newProfile, 'newProfile');
    	component_subscribe($$self, newProfile, $$value => $$invalidate(0, $newProfile = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(1, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindowForm3', slots, []);
    	let { subWindowButtonDisabled } = $$props;
    	let message;

    	if ($pageIndex == 0) {
    		message = "Where do they belong?";
    	} else message = "What do they do?";

    	const writable_props = ['subWindowButtonDisabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowForm3> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$newProfile.Student.Course = this.value;
    		newProfile.set($newProfile);
    	}

    	function input1_input_handler() {
    		$newProfile.Student.Year = this.value;
    		newProfile.set($newProfile);
    	}

    	function input2_input_handler() {
    		$newProfile.Student.Section = this.value;
    		newProfile.set($newProfile);
    	}

    	function input_input_handler() {
    		$newProfile.Occupation = this.value;
    		newProfile.set($newProfile);
    	}

    	$$self.$$set = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(3, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		newProfile,
    		pageIndex,
    		subWindowButtonDisabled,
    		message,
    		$newProfile,
    		$pageIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(3, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    		if ('message' in $$props) $$invalidate(2, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$pageIndex, $newProfile*/ 3) {
    			if ($pageIndex == 0) {
    				if ($newProfile.Student.Section != "" && $newProfile.Student.Year != "" && $newProfile.Student.Course != "") {
    					$$invalidate(3, subWindowButtonDisabled = false);
    				} else $$invalidate(3, subWindowButtonDisabled = true);
    			} else {
    				if ($newProfile.Occupation != "") {
    					$$invalidate(3, subWindowButtonDisabled = false);
    				} else $$invalidate(3, subWindowButtonDisabled = true);
    			}
    		}
    	};

    	return [
    		$newProfile,
    		$pageIndex,
    		message,
    		subWindowButtonDisabled,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input_input_handler
    	];
    }

    class SubWindowForm3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { subWindowButtonDisabled: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowForm3",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*subWindowButtonDisabled*/ ctx[3] === undefined && !('subWindowButtonDisabled' in props)) {
    			console.warn("<SubWindowForm3> was created without expected prop 'subWindowButtonDisabled'");
    		}
    	}

    	get subWindowButtonDisabled() {
    		throw new Error("<SubWindowForm3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subWindowButtonDisabled(value) {
    		throw new Error("<SubWindowForm3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SubWindowForm4.svelte generated by Svelte v3.44.2 */
    const file$c = "src\\components\\SubWindowForm4.svelte";

    // (30:4) {:else}
    function create_else_block_1$1(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue object-cover svelte-157j3kt");
    			if (!src_url_equal(img.src, img_src_value = /*$newProfile*/ ctx[0].Images.First)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "First");
    			add_location(img, file$c, 30, 6, 1466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler_1*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$newProfile*/ 1 && !src_url_equal(img.src, img_src_value = /*$newProfile*/ ctx[0].Images.First)) {
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
    		source: "(30:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:4) {#if $newProfile.Images.First == ""}
    function create_if_block_1$6(ctx) {
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
    			add_location(line0, file$c, 28, 285, 1351);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$c, 28, 329, 1395);
    			attr_dev(svg, "class", "my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue svelte-157j3kt");
    			set_style(svg, "stroke", "#efefef");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file$c, 28, 6, 1072);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line0);
    			append_dev(svg, line1);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*click_handler*/ ctx[3], false, false, false);
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
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(28:4) {#if $newProfile.Images.First == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (35:4) {:else}
    function create_else_block$4(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue object-cover svelte-157j3kt");
    			if (!src_url_equal(img.src, img_src_value = /*$newProfile*/ ctx[0].Images.Second)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Second");
    			add_location(img, file$c, 35, 6, 2082);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler_3*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$newProfile*/ 1 && !src_url_equal(img.src, img_src_value = /*$newProfile*/ ctx[0].Images.Second)) {
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(35:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:4) {#if $newProfile.Images.Second == ""}
    function create_if_block$8(ctx) {
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
    			add_location(line0, file$c, 33, 285, 1967);
    			attr_dev(line1, "x1", "5");
    			attr_dev(line1, "y1", "12");
    			attr_dev(line1, "x2", "19");
    			attr_dev(line1, "y2", "12");
    			add_location(line1, file$c, 33, 329, 2011);
    			attr_dev(svg, "class", "my-2 mx-2 w-32 h-32 stroke-1 rounded-full custom-bg-blue svelte-157j3kt");
    			set_style(svg, "stroke", "#efefef");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file$c, 33, 6, 1688);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line0);
    			append_dev(svg, line1);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*click_handler_2*/ ctx[5], false, false, false);
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(33:4) {#if $newProfile.Images.Second == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let p;
    	let t1;
    	let div0;
    	let t2;
    	let div1_intro;
    	let div1_outro;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*$newProfile*/ ctx[0].Images.First == "") return create_if_block_1$6;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$newProfile*/ ctx[0].Images.Second == "") return create_if_block$8;
    		return create_else_block$4;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Click one of the circles, add an image.";
    			t1 = space();
    			div0 = element("div");
    			if_block0.c();
    			t2 = space();
    			if_block1.c();
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$c, 25, 2, 825);
    			attr_dev(div0, "class", "bg-transparent flex flex-row justify-center items-center");
    			add_location(div0, file$c, 26, 2, 952);
    			attr_dev(div1, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div1, file$c, 24, 0, 656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if_block0.m(div0, null);
    			append_dev(div0, t2);
    			if_block1.m(div0, null);
    			current = true;
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
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fly, { delay: 200, y: -100, duration: 150 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			if_block1.d();
    			if (detaching && div1_outro) div1_outro.end();
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
    	let $newProfile;
    	validate_store(newProfile, 'newProfile');
    	component_subscribe($$self, newProfile, $$value => $$invalidate(0, $newProfile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindowForm4', slots, []);
    	const { ipcRenderer } = require("electron");
    	let { subWindowButtonDisabled } = $$props;

    	let selectImage = num => {
    		switch (num) {
    			case 1:
    				set_store_value(newProfile, $newProfile.Images.First = ipcRenderer.sendSync("select-image"), $newProfile);
    				break;
    			case 2:
    				set_store_value(newProfile, $newProfile.Images.Second = ipcRenderer.sendSync("select-image"), $newProfile);
    				break;
    		}
    	};

    	const writable_props = ['subWindowButtonDisabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowForm4> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => selectImage(1);
    	const click_handler_1 = () => selectImage(1);
    	const click_handler_2 = () => selectImage(2);
    	const click_handler_3 = () => selectImage(2);

    	$$self.$$set = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(2, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    	};

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		fly,
    		newProfile,
    		subWindowButtonDisabled,
    		selectImage,
    		$newProfile
    	});

    	$$self.$inject_state = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(2, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    		if ('selectImage' in $$props) $$invalidate(1, selectImage = $$props.selectImage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$newProfile*/ 1) {
    			if ($newProfile.Images.First != "" && $newProfile.Images.Second != "") {
    				$$invalidate(2, subWindowButtonDisabled = false);
    			} else {
    				$$invalidate(2, subWindowButtonDisabled = true);
    			}
    		}
    	};

    	return [
    		$newProfile,
    		selectImage,
    		subWindowButtonDisabled,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class SubWindowForm4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { subWindowButtonDisabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowForm4",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*subWindowButtonDisabled*/ ctx[2] === undefined && !('subWindowButtonDisabled' in props)) {
    			console.warn("<SubWindowForm4> was created without expected prop 'subWindowButtonDisabled'");
    		}
    	}

    	get subWindowButtonDisabled() {
    		throw new Error("<SubWindowForm4>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subWindowButtonDisabled(value) {
    		throw new Error("<SubWindowForm4>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SubWindowFormStatusReq.svelte generated by Svelte v3.44.2 */
    const file$b = "src\\components\\SubWindowFormStatusReq.svelte";

    function create_fragment$b(ctx) {
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
    	let div_intro;
    	let div_outro;
    	let current;

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
    			p.textContent = "Submitting to the database...";
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$b, 61, 4, 2029);
    			attr_dev(path1, "class", "eye svelte-1nbivej");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$b, 62, 4, 4074);
    			attr_dev(path2, "class", "eye svelte-1nbivej");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$b, 63, 4, 4529);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$b, 64, 4, 4980);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$b, 67, 4, 10459);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$b, 68, 4, 10493);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$b, 66, 4, 10331);
    			add_location(defs, file$b, 65, 4, 10319);
    			attr_dev(svg, "class", "h-40 bg-transparent");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$b, 60, 2, 1923);
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$b, 72, 2, 10582);
    			attr_dev(div, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div, file$b, 59, 0, 1754);
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
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fly, { delay: 200, y: -100, duration: 150 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
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

    function instance$b($$self, $$props, $$invalidate) {
    	let $subWindowStatus;
    	let $editProfile;
    	let $pageIndex;
    	let $newProfile;
    	validate_store(subWindowStatus, 'subWindowStatus');
    	component_subscribe($$self, subWindowStatus, $$value => $$invalidate(2, $subWindowStatus = $$value));
    	validate_store(editProfile, 'editProfile');
    	component_subscribe($$self, editProfile, $$value => $$invalidate(3, $editProfile = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(4, $pageIndex = $$value));
    	validate_store(newProfile, 'newProfile');
    	component_subscribe($$self, newProfile, $$value => $$invalidate(5, $newProfile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindowFormStatusReq', slots, []);
    	const axios = require("axios").default;
    	let { subWindowButtonDisabled } = $$props;
    	let url;

    	if ($newProfile != "") {
    		if ($pageIndex == 0) {
    			url = "http://localhost:14500/api/student/post";
    		} else url = "http://localhost:14500/api/employee/post";

    		try {
    			let req = axios.post(url, $newProfile);

    			req.then(res => {
    				if (res.data.status == 1) {
    					setTimeout(
    						() => {
    							$$invalidate(0, subWindowButtonDisabled = false);
    							set_store_value(subWindowStatus, $subWindowStatus += 1, $subWindowStatus);
    						},
    						2000
    					);
    				} else if (res.data.status == 2) {
    					setTimeout(
    						() => {
    							$$invalidate(0, subWindowButtonDisabled = false);
    							set_store_value(subWindowStatus, $subWindowStatus += 2, $subWindowStatus);
    						},
    						2000
    					);
    				}
    			});
    		} catch {
    			set_store_value(subWindowStatus, $subWindowStatus += 2, $subWindowStatus);
    		}
    	} else if ($editProfile != "") {
    		if ($pageIndex == 0) {
    			url = `http://localhost:14500/api/student/patch/${$editProfile._id}`;
    		} else url = `http://localhost:14500/api/employee/patch/${$editProfile._id}`;

    		try {
    			let req = axios.patch(url, $editProfile);

    			req.then(res => {
    				if (res.data.status == 1) {
    					setTimeout(
    						() => {
    							$$invalidate(0, subWindowButtonDisabled = false);
    							set_store_value(subWindowStatus, $subWindowStatus += 1, $subWindowStatus);
    						},
    						2000
    					);
    				} else if (res.data.status == 2) {
    					setTimeout(
    						() => {
    							$$invalidate(0, subWindowButtonDisabled = false);
    							set_store_value(subWindowStatus, $subWindowStatus += 2, $subWindowStatus);
    						},
    						2000
    					);
    				}
    			});
    		} catch {
    			set_store_value(subWindowStatus, $subWindowStatus += 2, $subWindowStatus);
    		}
    	}

    	const writable_props = ['subWindowButtonDisabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowFormStatusReq> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(0, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    	};

    	$$self.$capture_state = () => ({
    		axios,
    		fly,
    		subWindowStatus,
    		newProfile,
    		editProfile,
    		pageIndex,
    		subWindowButtonDisabled,
    		url,
    		$subWindowStatus,
    		$editProfile,
    		$pageIndex,
    		$newProfile
    	});

    	$$self.$inject_state = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(0, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    		if ('url' in $$props) url = $$props.url;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [subWindowButtonDisabled];
    }

    class SubWindowFormStatusReq extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { subWindowButtonDisabled: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowFormStatusReq",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*subWindowButtonDisabled*/ ctx[0] === undefined && !('subWindowButtonDisabled' in props)) {
    			console.warn("<SubWindowFormStatusReq> was created without expected prop 'subWindowButtonDisabled'");
    		}
    	}

    	get subWindowButtonDisabled() {
    		throw new Error("<SubWindowFormStatusReq>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subWindowButtonDisabled(value) {
    		throw new Error("<SubWindowFormStatusReq>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SubWindowFormStatusRes.svelte generated by Svelte v3.44.2 */
    const file$a = "src\\components\\SubWindowFormStatusRes.svelte";

    function create_fragment$a(ctx) {
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
    	let div_intro;
    	let div_outro;
    	let current;

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
    			t1 = text(/*message*/ ctx[0]);
    			attr_dev(path0, "d", "M30.0002 7.73627e-10C26.0606 -2.5826e-05 22.1595 0.6466 18.5197 1.90296C14.8799 3.15931 11.5727 5.0008 8.78687 7.32227C6.00109 9.64374 3.79128 12.3997 2.28363 15.4329C0.775975 18.466 -3.46703e-06 21.717 0 25C0.0043317 25.7207 0.0460567 26.4409 0.125058 27.1585H59.8749C59.9539 26.4409 59.9956 25.7207 60 25C60 18.3696 56.8393 12.0108 51.2133 7.32242C45.5872 2.63401 37.9567 6.29893e-05 30.0002 7.73624e-10V7.73627e-10ZM2.64842 29.8044C1.25038 29.8044 0.125058 30.752 0.125058 31.9293V48.8378C0.125058 50.0152 1.25038 50.9633 2.64842 50.9633C4.04645 50.9633 5.1723 50.0152 5.1723 48.8378V31.9293C5.1723 30.752 4.04645 29.8044 2.64842 29.8044ZM10.5859 29.8044C9.18788 29.8044 8.06256 30.752 8.06256 31.9293V48.8378C8.06256 50.0152 9.18788 50.9633 10.5859 50.9633C11.984 50.9633 13.1098 50.0152 13.1098 48.8378V31.9293C13.1098 30.752 11.984 29.8044 10.5859 29.8044ZM18.5234 29.8044C17.1254 29.8044 16.0001 30.752 16.0001 31.9293V48.8378C16.0001 50.0152 17.1254 50.9633 18.5234 50.9633C19.9215 50.9633 21.0473 50.0152 21.0473 48.8378V31.9293C21.0473 30.752 19.9215 29.8044 18.5234 29.8044ZM26.9901 29.8044C25.592 29.8044 24.4667 30.752 24.4667 31.9293V48.8378C24.4667 50.0152 25.592 50.9633 26.9901 50.9633C28.3881 50.9633 29.514 50.0152 29.514 48.8378V31.9293C29.514 30.752 28.3881 29.8044 26.9901 29.8044ZM34.9276 29.8044C33.5295 29.8044 32.4042 30.752 32.4042 31.9293V48.8378C32.4042 50.0152 33.5295 50.9633 34.9276 50.9633C36.3256 50.9633 37.4515 50.0152 37.4515 48.8378V31.9293C37.4515 30.752 36.3256 29.8044 34.9276 29.8044ZM50.0631 30.7118C48.4034 30.6528 46.7552 31.0081 45.2672 31.7455C43.7792 32.483 42.4983 33.5794 41.5401 34.9358C40.0556 37.0375 39.4383 39.6306 39.8166 42.1757C40.1949 44.7208 41.5398 47.0222 43.5715 48.6012C45.6031 50.1801 48.1651 50.9152 50.7247 50.6536C53.2844 50.392 55.6447 49.1538 57.3148 47.1966L58.368 45.7057C59.6546 43.4774 60.0328 40.8389 59.4238 38.3389C58.8149 35.8389 57.2657 33.6698 55.0984 32.2828C53.5908 31.3179 51.8519 30.7754 50.0631 30.7118V30.7118Z");
    			attr_dev(path0, "fill", "url(#paint0_linear_2:3)");
    			add_location(path0, file$a, 18, 4, 837);
    			attr_dev(path1, "class", "eye");
    			attr_dev(path1, "opacity", "0.8");
    			attr_dev(path1, "d", "M51.9176 42.7785C51.4165 43.3657 50.7084 43.7372 49.9405 43.8157C49.1726 43.8942 48.404 43.6736 47.7945 43.1999C47.185 42.7262 46.7816 42.0358 46.6681 41.2723C46.5546 40.5088 46.7398 39.7309 47.1852 39.1004C47.6305 38.4699 48.3018 38.0353 49.0593 37.8871C49.8169 37.7388 50.6024 37.8883 51.2526 38.3044C51.9028 38.7205 52.3675 39.3712 52.5502 40.1212C52.7329 40.8712 52.6195 41.6627 52.2336 42.3312");
    			attr_dev(path1, "fill", "black");
    			add_location(path1, file$a, 19, 4, 2882);
    			attr_dev(path2, "class", "eye");
    			attr_dev(path2, "opacity", "0.8");
    			attr_dev(path2, "d", "M51.7044 40.7437C51.4288 41.0667 51.0393 41.271 50.617 41.3142C50.1946 41.3574 49.7719 41.2361 49.4367 40.9755C49.1015 40.715 48.8796 40.3353 48.8171 39.9153C48.7547 39.4954 48.8566 39.0675 49.1015 38.7208C49.3465 38.374 49.7157 38.135 50.1323 38.0535C50.549 37.9719 50.981 38.0541 51.3386 38.283C51.6962 38.5118 51.9519 38.8697 52.0523 39.2822C52.1528 39.6947 52.0904 40.1301 51.8782 40.4977");
    			attr_dev(path2, "fill", "#D5F6FF");
    			add_location(path2, file$a, 20, 4, 3337);
    			attr_dev(path3, "d", "M2.28869 59.5792V64H1.37173V53.1455H5.06942C6.19761 53.1455 7.08725 53.4337 7.73832 54.0103C8.39436 54.5868 8.72238 55.3795 8.72238 56.3884C8.72238 57.4073 8.40679 58.195 7.7756 58.7517C7.14937 59.3033 6.23986 59.5792 5.04705 59.5792H2.28869ZM2.28869 58.8038H5.06942C5.95905 58.8038 6.63746 58.5926 7.10464 58.1702C7.57182 57.7477 7.80542 57.1588 7.80542 56.4033C7.80542 55.6529 7.57182 55.0564 7.10464 54.6141C6.64243 54.1668 5.9839 53.9382 5.12906 53.9283H2.28869V58.8038ZM6.96687 63.4632C6.96687 63.2893 7.02154 63.1427 7.13089 63.0234C7.2452 62.8991 7.40175 62.837 7.60055 62.837C7.79935 62.837 7.95591 62.8991 8.07022 63.0234C8.18453 63.1427 8.24168 63.2893 8.24168 63.4632C8.24168 63.6372 8.18453 63.7813 8.07022 63.8956C7.95591 64.005 7.79935 64.0596 7.60055 64.0596C7.40175 64.0596 7.2452 64.005 7.13089 63.8956C7.02154 63.7813 6.96687 63.6372 6.96687 63.4632ZM13.6245 53.1455L17.6279 62.7252L21.6461 53.1455H22.8688V64H21.9518V59.2735L22.0263 54.4277L17.9857 64H17.2775L13.2518 54.465L13.3263 59.2437V64H12.4093V53.1455H13.6245ZM27.4277 64.1491C26.7418 64.1491 26.1205 63.9801 25.5639 63.6422C25.0122 63.3042 24.5823 62.8345 24.2742 62.2332C23.966 61.6268 23.812 60.9484 23.812 60.1979V59.8774C23.812 59.102 23.9611 58.4038 24.2593 57.7825C24.5624 57.1613 24.9824 56.6742 25.5192 56.3213C26.0559 55.9635 26.6374 55.7846 27.2636 55.7846C28.2427 55.7846 29.0181 56.12 29.5896 56.791C30.1661 57.457 30.4544 58.369 30.4544 59.527V60.0265H24.6991V60.1979C24.6991 61.1124 24.96 61.8753 25.4819 62.4866C26.0087 63.093 26.6697 63.3961 27.4649 63.3961C27.942 63.3961 28.362 63.3092 28.7248 63.1352C29.0926 62.9613 29.4256 62.6829 29.7238 62.3003L30.2829 62.7252C29.6269 63.6745 28.6751 64.1491 27.4277 64.1491ZM27.2636 56.545C26.5927 56.545 26.0261 56.791 25.5639 57.283C25.1067 57.7751 24.8283 58.4361 24.7289 59.2661H29.5672V59.1691C29.5424 58.3938 29.3212 57.7626 28.9037 57.2756C28.4863 56.7885 27.9396 56.545 27.2636 56.545ZM30.7267 59.8923C30.7267 58.6398 31.005 57.6433 31.5616 56.9028C32.1232 56.1573 32.8836 55.7846 33.8429 55.7846C34.9313 55.7846 35.7613 56.2145 36.3328 57.0743V52.5491H37.22V64H36.385L36.3477 62.9265C35.7762 63.7416 34.9363 64.1491 33.8279 64.1491C32.8985 64.1491 32.1481 63.7763 31.5765 63.0308C31.0099 62.2804 30.7267 61.269 30.7267 59.9966V59.8923ZM31.6287 60.0488C31.6287 61.0776 31.835 61.8902 32.2475 62.4866C32.66 63.0781 33.2415 63.3738 33.992 63.3738C35.0903 63.3738 35.8706 62.8892 36.3328 61.92V58.1329C35.8706 57.0842 35.0953 56.5599 34.0069 56.5599C33.2564 56.5599 32.6724 56.8556 32.2549 57.447C31.8374 58.0335 31.6287 58.9008 31.6287 60.0488ZM43.6501 62.9787C43.1133 63.759 42.256 64.1491 41.0781 64.1491C40.2183 64.1491 39.5647 63.9006 39.1174 63.4036C38.6701 62.9016 38.4415 62.1611 38.4316 61.182V55.9337H39.3187V61.0702C39.3187 62.6059 39.94 63.3738 41.1825 63.3738C42.4747 63.3738 43.2923 62.8395 43.6352 61.7709V55.9337H44.5298V64H43.665L43.6501 62.9787ZM50.5797 61.9499C50.5797 61.5075 50.4008 61.1522 50.0429 60.8838C49.6901 60.6154 49.1558 60.4067 48.4401 60.2576C47.7244 60.1035 47.1678 59.9296 46.7702 59.7357C46.3775 59.5369 46.0843 59.2959 45.8905 59.0126C45.7016 58.7293 45.6072 58.3864 45.6072 57.9838C45.6072 57.3476 45.8731 56.8233 46.4049 56.4108C46.9367 55.9933 47.6176 55.7846 48.4476 55.7846C49.3471 55.7846 50.0678 56.0082 50.6095 56.4555C51.1562 56.8978 51.4296 57.4768 51.4296 58.1925H50.535C50.535 57.7204 50.3362 57.3277 49.9386 57.0146C49.5459 56.7015 49.0489 56.545 48.4476 56.545C47.8611 56.545 47.3889 56.6767 47.0311 56.9401C46.6782 57.1985 46.5018 57.5365 46.5018 57.954C46.5018 58.3565 46.6484 58.6697 46.9416 58.8933C47.2398 59.112 47.7791 59.3133 48.5594 59.4972C49.3446 59.6811 49.9311 59.8774 50.3188 60.0861C50.7114 60.2949 51.0021 60.5458 51.191 60.8391C51.3799 61.1323 51.4743 61.4877 51.4743 61.9051C51.4743 62.586 51.1985 63.1302 50.6468 63.5378C50.1001 63.9453 49.3844 64.1491 48.4997 64.1491C47.5604 64.1491 46.7975 63.923 46.211 63.4707C45.6296 63.0135 45.3388 62.4369 45.3388 61.7411H46.2334C46.2682 62.263 46.4869 62.6705 46.8895 62.9638C47.297 63.252 47.8338 63.3961 48.4997 63.3961C49.121 63.3961 49.623 63.2595 50.0057 62.9861C50.3883 62.7128 50.5797 62.3673 50.5797 61.9499ZM57.472 64C57.3826 63.7465 57.3254 63.3713 57.3006 62.8743C56.9874 63.2818 56.5874 63.5974 56.1003 63.8211C55.6182 64.0398 55.1063 64.1491 54.5646 64.1491C53.7892 64.1491 53.1605 63.9329 52.6784 63.5005C52.2013 63.0681 51.9627 62.5214 51.9627 61.8604C51.9627 61.0751 52.2883 60.4539 52.9394 59.9966C53.5954 59.5394 54.5074 59.3108 55.6754 59.3108H57.2931V58.3938C57.2931 57.8173 57.1142 57.365 56.7563 57.037C56.4035 56.704 55.8866 56.5375 55.2057 56.5375C54.5844 56.5375 54.07 56.6966 53.6625 57.0146C53.255 57.3327 53.0512 57.7154 53.0512 58.1627L52.1566 58.1553C52.1566 57.5141 52.4548 56.96 53.0512 56.4928C53.6476 56.0206 54.3807 55.7846 55.2504 55.7846C56.15 55.7846 56.8582 56.0107 57.3751 56.463C57.897 56.9103 58.1653 57.5365 58.1802 58.3416V62.1586C58.1802 62.9389 58.2622 63.5229 58.4263 63.9105V64H57.472ZM54.6689 63.3589C55.2653 63.3589 55.7971 63.2147 56.2643 62.9265C56.7365 62.6382 57.0794 62.253 57.2931 61.7709V59.9966H55.6977C54.8081 60.0066 54.1123 60.1706 53.6103 60.4887C53.1083 60.8018 52.8574 61.2342 52.8574 61.7859C52.8574 62.2381 53.0238 62.6134 53.3568 62.9116C53.6948 63.2098 54.1322 63.3589 54.6689 63.3589Z");
    			attr_dev(path3, "fill", "#009DC4");
    			add_location(path3, file$a, 21, 4, 3788);
    			attr_dev(stop0, "stop-color", "#009DC4");
    			add_location(stop0, file$a, 24, 4, 9267);
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "stop-color", "#80B3FF");
    			add_location(stop1, file$a, 25, 4, 9301);
    			attr_dev(linearGradient, "id", "paint0_linear_2:3");
    			attr_dev(linearGradient, "x1", "2.40282");
    			attr_dev(linearGradient, "y1", "49.0936");
    			attr_dev(linearGradient, "x2", "41.2264");
    			attr_dev(linearGradient, "y2", "16.0936");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			add_location(linearGradient, file$a, 23, 4, 9139);
    			add_location(defs, file$a, 22, 4, 9127);
    			attr_dev(svg, "class", "h-40 bg-transparent");
    			attr_dev(svg, "viewBox", "0 0 60 68");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$a, 17, 2, 731);
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$a, 29, 2, 9390);
    			attr_dev(div, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div, file$a, 16, 0, 562);
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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*message*/ 1) set_data_dev(t1, /*message*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fly, { delay: 200, y: -100, duration: 150 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
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
    	let $subWindowStatus;
    	validate_store(subWindowStatus, 'subWindowStatus');
    	component_subscribe($$self, subWindowStatus, $$value => $$invalidate(2, $subWindowStatus = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindowFormStatusRes', slots, []);
    	let { subWindowButtonDisabled } = $$props;
    	subWindowButtonDisabled = false;
    	let message;

    	if ($subWindowStatus == 5) {
    		message = "Congrats, data has been sent to the database. Kindly restart the Raspberry Pi.";
    	} else if ($subWindowStatus == 6) {
    		message = "Aww, something happened. Please try again right about... now.";
    	}

    	const writable_props = ['subWindowButtonDisabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowFormStatusRes> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(1, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		newProfile,
    		pageIndex,
    		subWindowStatus,
    		subWindowButtonDisabled,
    		message,
    		$subWindowStatus
    	});

    	$$self.$inject_state = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(1, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, subWindowButtonDisabled];
    }

    class SubWindowFormStatusRes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { subWindowButtonDisabled: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowFormStatusRes",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*subWindowButtonDisabled*/ ctx[1] === undefined && !('subWindowButtonDisabled' in props)) {
    			console.warn("<SubWindowFormStatusRes> was created without expected prop 'subWindowButtonDisabled'");
    		}
    	}

    	get subWindowButtonDisabled() {
    		throw new Error("<SubWindowFormStatusRes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subWindowButtonDisabled(value) {
    		throw new Error("<SubWindowFormStatusRes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SubWindowFormEdit.svelte generated by Svelte v3.44.2 */
    const file$9 = "src\\components\\SubWindowFormEdit.svelte";

    // (19:30) 
    function create_if_block_1$5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center svelte-x282d8");
    			set_style(input, "color", "#efefef");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter occupation");
    			add_location(input, file$9, 19, 6, 1911);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$editProfile*/ ctx[1].Occupation);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[8]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$editProfile*/ 2 && input.value !== /*$editProfile*/ ctx[1].Occupation) {
    				set_input_value(input, /*$editProfile*/ ctx[1].Occupation);
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
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(19:30) ",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if $pageIndex == 0}
    function create_if_block$7(ctx) {
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
    			attr_dev(input0, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center svelte-x282d8");
    			set_style(input0, "color", "#efefef");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter course");
    			add_location(input0, file$9, 13, 6, 996);
    			attr_dev(input1, "class", "font-light w-full mr-2 rounded-full px-5 py-1 mb-2 bg-transparent text-center svelte-x282d8");
    			set_style(input1, "color", "#efefef");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "oninput", "this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');");
    			attr_dev(input1, "placeholder", "Enter year");
    			add_location(input1, file$9, 15, 8, 1279);
    			attr_dev(input2, "class", "font-light w-full ml-2 rounded-full px-5 py-1 mb-2 bg-transparent text-center svelte-x282d8");
    			set_style(input2, "color", "#efefef");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "oninput", "this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');");
    			attr_dev(input2, "placeholder", "Enter section");
    			add_location(input2, file$9, 16, 8, 1570);
    			attr_dev(div, "class", "bg-transparent flex w-80 justify-between items-center flex-row");
    			add_location(div, file$9, 14, 6, 1193);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*$editProfile*/ ctx[1].Student.Course);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input1);
    			set_input_value(input1, /*$editProfile*/ ctx[1].Student.Year);
    			append_dev(div, t1);
    			append_dev(div, input2);
    			set_input_value(input2, /*$editProfile*/ ctx[1].Student.Section);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$editProfile*/ 2 && input0.value !== /*$editProfile*/ ctx[1].Student.Course) {
    				set_input_value(input0, /*$editProfile*/ ctx[1].Student.Course);
    			}

    			if (dirty & /*$editProfile*/ 2 && input1.value !== /*$editProfile*/ ctx[1].Student.Year) {
    				set_input_value(input1, /*$editProfile*/ ctx[1].Student.Year);
    			}

    			if (dirty & /*$editProfile*/ 2 && input2.value !== /*$editProfile*/ ctx[1].Student.Section) {
    				set_input_value(input2, /*$editProfile*/ ctx[1].Student.Section);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(13:4) {#if $pageIndex == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let p;
    	let t0;
    	let t1_value = /*$selectedProfile*/ ctx[0].Name.First + "";
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let input0;
    	let t4;
    	let input1;
    	let t5;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$pageIndex*/ ctx[2] == 0) return create_if_block$7;
    		if (/*$pageIndex*/ ctx[2] == 1) return create_if_block_1$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			t0 = text("What's wrong with ");
    			t1 = text(t1_value);
    			t2 = text("?");
    			t3 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			if (if_block) if_block.c();
    			attr_dev(p, "class", "bg-transparent font-light text-3xl mt-2 custom-text-blue text-center");
    			add_location(p, file$9, 8, 2, 390);
    			attr_dev(input0, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center mt-4 svelte-x282d8");
    			set_style(input0, "color", "#efefef");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter first name");
    			add_location(input0, file$9, 10, 4, 574);
    			attr_dev(input1, "class", "font-light rounded-full w-80 px-5 py-1 mb-2 bg-transparent text-center svelte-x282d8");
    			set_style(input1, "color", "#efefef");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Enter last name");
    			add_location(input1, file$9, 11, 4, 774);
    			attr_dev(div0, "class", "bg-transparent flex flex-col");
    			add_location(div0, file$9, 9, 2, 526);
    			attr_dev(div1, "class", "bg-transparent flex flex-col justify-center items-center h-full w-full");
    			add_location(div1, file$9, 7, 0, 221);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*$editProfile*/ ctx[1].Name.First);
    			append_dev(div0, t4);
    			append_dev(div0, input1);
    			set_input_value(input1, /*$editProfile*/ ctx[1].Name.Last);
    			append_dev(div0, t5);
    			if (if_block) if_block.m(div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$selectedProfile*/ 1) && t1_value !== (t1_value = /*$selectedProfile*/ ctx[0].Name.First + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$editProfile*/ 2 && input0.value !== /*$editProfile*/ ctx[1].Name.First) {
    				set_input_value(input0, /*$editProfile*/ ctx[1].Name.First);
    			}

    			if (dirty & /*$editProfile*/ 2 && input1.value !== /*$editProfile*/ ctx[1].Name.Last) {
    				set_input_value(input1, /*$editProfile*/ ctx[1].Name.Last);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fly, { delay: 200, y: -100, duration: 150 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: 100, duration: 150 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}

    			if (detaching && div1_outro) div1_outro.end();
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
    	let $selectedProfile;
    	let $editProfile;
    	let $pageIndex;
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(0, $selectedProfile = $$value));
    	validate_store(editProfile, 'editProfile');
    	component_subscribe($$self, editProfile, $$value => $$invalidate(1, $editProfile = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(2, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindowFormEdit', slots, []);
    	editProfile.set($selectedProfile);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindowFormEdit> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$editProfile.Name.First = this.value;
    		editProfile.set($editProfile);
    	}

    	function input1_input_handler() {
    		$editProfile.Name.Last = this.value;
    		editProfile.set($editProfile);
    	}

    	function input0_input_handler_1() {
    		$editProfile.Student.Course = this.value;
    		editProfile.set($editProfile);
    	}

    	function input1_input_handler_1() {
    		$editProfile.Student.Year = this.value;
    		editProfile.set($editProfile);
    	}

    	function input2_input_handler() {
    		$editProfile.Student.Section = this.value;
    		editProfile.set($editProfile);
    	}

    	function input_input_handler() {
    		$editProfile.Occupation = this.value;
    		editProfile.set($editProfile);
    	}

    	$$self.$capture_state = () => ({
    		fly,
    		pageIndex,
    		selectedProfile,
    		editProfile,
    		$selectedProfile,
    		$editProfile,
    		$pageIndex
    	});

    	return [
    		$selectedProfile,
    		$editProfile,
    		$pageIndex,
    		input0_input_handler,
    		input1_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input2_input_handler,
    		input_input_handler
    	];
    }

    class SubWindowFormEdit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindowFormEdit",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\SubWindow.svelte generated by Svelte v3.44.2 */
    const file$8 = "src\\components\\SubWindow.svelte";

    // (102:39) 
    function create_if_block_7(ctx) {
    	let subwindowformedit;
    	let current;
    	subwindowformedit = new SubWindowFormEdit({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(subwindowformedit.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowformedit, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowformedit.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowformedit.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowformedit, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(102:39) ",
    		ctx
    	});

    	return block;
    }

    // (100:63) 
    function create_if_block_6(ctx) {
    	let subwindowformstatusres;
    	let current;
    	subwindowformstatusres = new SubWindowFormStatusRes({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(subwindowformstatusres.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowformstatusres, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowformstatusres.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowformstatusres.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowformstatusres, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(100:63) ",
    		ctx
    	});

    	return block;
    }

    // (98:38) 
    function create_if_block_5$1(ctx) {
    	let subwindowformstatusreq;
    	let updating_subWindowButtonDisabled;
    	let current;

    	function subwindowformstatusreq_subWindowButtonDisabled_binding(value) {
    		/*subwindowformstatusreq_subWindowButtonDisabled_binding*/ ctx[9](value);
    	}

    	let subwindowformstatusreq_props = {};

    	if (/*subWindowButtonDisabled*/ ctx[0] !== void 0) {
    		subwindowformstatusreq_props.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    	}

    	subwindowformstatusreq = new SubWindowFormStatusReq({
    			props: subwindowformstatusreq_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(subwindowformstatusreq, 'subWindowButtonDisabled', subwindowformstatusreq_subWindowButtonDisabled_binding));

    	const block = {
    		c: function create() {
    			create_component(subwindowformstatusreq.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowformstatusreq, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const subwindowformstatusreq_changes = {};

    			if (!updating_subWindowButtonDisabled && dirty & /*subWindowButtonDisabled*/ 1) {
    				updating_subWindowButtonDisabled = true;
    				subwindowformstatusreq_changes.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    				add_flush_callback(() => updating_subWindowButtonDisabled = false);
    			}

    			subwindowformstatusreq.$set(subwindowformstatusreq_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowformstatusreq.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowformstatusreq.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowformstatusreq, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(98:38) ",
    		ctx
    	});

    	return block;
    }

    // (96:38) 
    function create_if_block_4$1(ctx) {
    	let subwindowform4;
    	let updating_subWindowButtonDisabled;
    	let current;

    	function subwindowform4_subWindowButtonDisabled_binding(value) {
    		/*subwindowform4_subWindowButtonDisabled_binding*/ ctx[8](value);
    	}

    	let subwindowform4_props = {};

    	if (/*subWindowButtonDisabled*/ ctx[0] !== void 0) {
    		subwindowform4_props.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    	}

    	subwindowform4 = new SubWindowForm4({
    			props: subwindowform4_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(subwindowform4, 'subWindowButtonDisabled', subwindowform4_subWindowButtonDisabled_binding));

    	const block = {
    		c: function create() {
    			create_component(subwindowform4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowform4, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const subwindowform4_changes = {};

    			if (!updating_subWindowButtonDisabled && dirty & /*subWindowButtonDisabled*/ 1) {
    				updating_subWindowButtonDisabled = true;
    				subwindowform4_changes.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    				add_flush_callback(() => updating_subWindowButtonDisabled = false);
    			}

    			subwindowform4.$set(subwindowform4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowform4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowform4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowform4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(96:38) ",
    		ctx
    	});

    	return block;
    }

    // (94:38) 
    function create_if_block_3$2(ctx) {
    	let subwindowform3;
    	let updating_subWindowButtonDisabled;
    	let current;

    	function subwindowform3_subWindowButtonDisabled_binding(value) {
    		/*subwindowform3_subWindowButtonDisabled_binding*/ ctx[7](value);
    	}

    	let subwindowform3_props = {};

    	if (/*subWindowButtonDisabled*/ ctx[0] !== void 0) {
    		subwindowform3_props.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    	}

    	subwindowform3 = new SubWindowForm3({
    			props: subwindowform3_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(subwindowform3, 'subWindowButtonDisabled', subwindowform3_subWindowButtonDisabled_binding));

    	const block = {
    		c: function create() {
    			create_component(subwindowform3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowform3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const subwindowform3_changes = {};

    			if (!updating_subWindowButtonDisabled && dirty & /*subWindowButtonDisabled*/ 1) {
    				updating_subWindowButtonDisabled = true;
    				subwindowform3_changes.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    				add_flush_callback(() => updating_subWindowButtonDisabled = false);
    			}

    			subwindowform3.$set(subwindowform3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowform3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowform3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowform3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(94:38) ",
    		ctx
    	});

    	return block;
    }

    // (92:38) 
    function create_if_block_2$2(ctx) {
    	let subwindowform2;
    	let updating_subWindowButtonDisabled;
    	let current;

    	function subwindowform2_subWindowButtonDisabled_binding(value) {
    		/*subwindowform2_subWindowButtonDisabled_binding*/ ctx[6](value);
    	}

    	let subwindowform2_props = {};

    	if (/*subWindowButtonDisabled*/ ctx[0] !== void 0) {
    		subwindowform2_props.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    	}

    	subwindowform2 = new SubWindowForm2({
    			props: subwindowform2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(subwindowform2, 'subWindowButtonDisabled', subwindowform2_subWindowButtonDisabled_binding));

    	const block = {
    		c: function create() {
    			create_component(subwindowform2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowform2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const subwindowform2_changes = {};

    			if (!updating_subWindowButtonDisabled && dirty & /*subWindowButtonDisabled*/ 1) {
    				updating_subWindowButtonDisabled = true;
    				subwindowform2_changes.subWindowButtonDisabled = /*subWindowButtonDisabled*/ ctx[0];
    				add_flush_callback(() => updating_subWindowButtonDisabled = false);
    			}

    			subwindowform2.$set(subwindowform2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowform2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowform2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowform2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(92:38) ",
    		ctx
    	});

    	return block;
    }

    // (90:6) {#if $subWindowStatus == 0}
    function create_if_block_1$4(ctx) {
    	let subwindowform1;
    	let current;
    	subwindowform1 = new SubWindowForm1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(subwindowform1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindowform1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindowform1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindowform1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindowform1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(90:6) {#if $subWindowStatus == 0}",
    		ctx
    	});

    	return block;
    }

    // (120:4) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Save";
    			attr_dev(button, "class", "font-light rounded-full w-20 h-6 svelte-1dxizv4");
    			add_location(button, file$8, 121, 8, 4833);
    			attr_dev(div, "class", "flex w-full justify-center items-center bg-transparent");
    			add_location(div, file$8, 120, 6, 4755);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*saveButton*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(120:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#if $subWindowStatus < 10}
    function create_if_block$6(ctx) {
    	let div7;
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let div6;
    	let div0;
    	let t2;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let t5;
    	let div4;
    	let t6;
    	let div5;
    	let t7;
    	let button1;
    	let t8;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			button0 = element("button");
    			t0 = text("Back");
    			t1 = space();
    			div6 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			div5 = element("div");
    			t7 = space();
    			button1 = element("button");
    			t8 = text("Next");
    			attr_dev(button0, "class", "font-light rounded-full w-20 h-6 svelte-1dxizv4");
    			button0.disabled = button0_disabled_value = /*$subWindowStatus*/ ctx[1] <= 0 || /*$subWindowStatus*/ ctx[1] >= 4;
    			add_location(button0, file$8, 108, 8, 3724);
    			attr_dev(div0, "class", "nav-indicator w-7 h-2 mx-1 rounded-full svelte-1dxizv4");
    			toggle_class(div0, "active", /*$subWindowStatus*/ ctx[1] >= 0);
    			add_location(div0, file$8, 110, 10, 3936);
    			attr_dev(div1, "class", "nav-indicator w-7 h-2 mx-1 rounded-full svelte-1dxizv4");
    			toggle_class(div1, "active", /*$subWindowStatus*/ ctx[1] >= 1);
    			add_location(div1, file$8, 111, 10, 4044);
    			attr_dev(div2, "class", "nav-indicator w-7 h-2 mx-1 rounded-full svelte-1dxizv4");
    			toggle_class(div2, "active", /*$subWindowStatus*/ ctx[1] >= 2);
    			add_location(div2, file$8, 112, 10, 4152);
    			attr_dev(div3, "class", "nav-indicator w-7 h-2 mx-1 rounded-full svelte-1dxizv4");
    			toggle_class(div3, "active", /*$subWindowStatus*/ ctx[1] >= 3);
    			add_location(div3, file$8, 113, 10, 4260);
    			attr_dev(div4, "class", "nav-indicator w-7 h-2 mx-1 rounded-full svelte-1dxizv4");
    			toggle_class(div4, "active", /*$subWindowStatus*/ ctx[1] >= 4);
    			add_location(div4, file$8, 114, 10, 4368);
    			attr_dev(div5, "class", "nav-indicator w-7 h-2 mx-1 rounded-full svelte-1dxizv4");
    			toggle_class(div5, "active", /*$subWindowStatus*/ ctx[1] >= 5);
    			add_location(div5, file$8, 115, 10, 4476);
    			attr_dev(div6, "class", "bg-transparent flex flex-row");
    			add_location(div6, file$8, 109, 8, 3882);
    			attr_dev(button1, "class", "font-light rounded-full w-20 h-6 svelte-1dxizv4");
    			button1.disabled = /*subWindowButtonDisabled*/ ctx[0];
    			add_location(button1, file$8, 117, 8, 4598);
    			attr_dev(div7, "class", "flex w-full justify-between items-center bg-transparent");
    			add_location(div7, file$8, 107, 6, 3645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, button0);
    			append_dev(button0, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div6, t2);
    			append_dev(div6, div1);
    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div6, t5);
    			append_dev(div6, div4);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div7, t7);
    			append_dev(div7, button1);
    			append_dev(button1, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*switchPageRemove*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*switchPageAdd*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$subWindowStatus*/ 2 && button0_disabled_value !== (button0_disabled_value = /*$subWindowStatus*/ ctx[1] <= 0 || /*$subWindowStatus*/ ctx[1] >= 4)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$subWindowStatus*/ 2) {
    				toggle_class(div0, "active", /*$subWindowStatus*/ ctx[1] >= 0);
    			}

    			if (dirty & /*$subWindowStatus*/ 2) {
    				toggle_class(div1, "active", /*$subWindowStatus*/ ctx[1] >= 1);
    			}

    			if (dirty & /*$subWindowStatus*/ 2) {
    				toggle_class(div2, "active", /*$subWindowStatus*/ ctx[1] >= 2);
    			}

    			if (dirty & /*$subWindowStatus*/ 2) {
    				toggle_class(div3, "active", /*$subWindowStatus*/ ctx[1] >= 3);
    			}

    			if (dirty & /*$subWindowStatus*/ 2) {
    				toggle_class(div4, "active", /*$subWindowStatus*/ ctx[1] >= 4);
    			}

    			if (dirty & /*$subWindowStatus*/ 2) {
    				toggle_class(div5, "active", /*$subWindowStatus*/ ctx[1] >= 5);
    			}

    			if (dirty & /*subWindowButtonDisabled*/ 1) {
    				prop_dev(button1, "disabled", /*subWindowButtonDisabled*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(107:4) {#if $subWindowStatus < 10}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div0;
    	let div0_intro;
    	let div0_outro;
    	let t0;
    	let div4;
    	let div3;
    	let div1;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let t2;
    	let div2;
    	let current_block_type_index;
    	let if_block0;
    	let t3;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const if_block_creators = [
    		create_if_block_1$4,
    		create_if_block_2$2,
    		create_if_block_3$2,
    		create_if_block_4$1,
    		create_if_block_5$1,
    		create_if_block_6,
    		create_if_block_7
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$subWindowStatus*/ ctx[1] == 0) return 0;
    		if (/*$subWindowStatus*/ ctx[1] == 1) return 1;
    		if (/*$subWindowStatus*/ ctx[1] == 2) return 2;
    		if (/*$subWindowStatus*/ ctx[1] == 3) return 3;
    		if (/*$subWindowStatus*/ ctx[1] == 4) return 4;
    		if (/*$subWindowStatus*/ ctx[1] == 5 || /*$subWindowStatus*/ ctx[1] == 6) return 5;
    		if (/*$subWindowStatus*/ ctx[1] == 10) return 6;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*$subWindowStatus*/ ctx[1] < 10) return create_if_block$6;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			button = element("button");
    			t1 = text("Close");
    			t2 = space();
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if_block1.c();
    			attr_dev(div0, "class", "background fixed w-screen h-screen bg-black opacity-20 svelte-1dxizv4");
    			add_location(div0, file$8, 80, 0, 2196);
    			button.disabled = button_disabled_value = /*$subWindowStatus*/ ctx[1] >= 4 && /*$subWindowStatus*/ ctx[1] != 10;
    			attr_dev(button, "class", "close-btn font-light rounded-full w-20 h-6 svelte-1dxizv4");
    			add_location(button, file$8, 85, 6, 2677);
    			attr_dev(div1, "class", "w-full bg-transparent");
    			add_location(div1, file$8, 84, 4, 2634);
    			attr_dev(div2, "class", "bg-transparent overflow-hidden");
    			add_location(div2, file$8, 88, 4, 2874);
    			attr_dev(div3, "class", "sub-window-main grid w-full h-full sm:rounded-xl px-5 py-5 svelte-1dxizv4");
    			add_location(div3, file$8, 82, 2, 2446);
    			attr_dev(div4, "class", "sub-window fixed pl-14 w-screen h-screen bg-transparent flex justify-center items-center svelte-1dxizv4");
    			add_location(div4, file$8, 81, 0, 2340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, button);
    			append_dev(button, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div2, null);
    			}

    			append_dev(div3, t3);
    			if_block1.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*switchState*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$subWindowStatus*/ 2 && button_disabled_value !== (button_disabled_value = /*$subWindowStatus*/ ctx[1] >= 4 && /*$subWindowStatus*/ ctx[1] != 10)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div2, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				div0_intro = create_in_transition(div0, fade, { duration: 200 });
    				div0_intro.start();
    			});

    			transition_in(if_block0);

    			add_render_callback(() => {
    				if (div3_outro) div3_outro.end(1);
    				div3_intro = create_in_transition(div3, fly, { delay: 250, y: 500, duration: 200 });
    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, { delay: 250, duration: 200 });
    			transition_out(if_block0);
    			if (div3_intro) div3_intro.invalidate();
    			div3_outro = create_out_transition(div3, fly, { y: 50, duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_outro) div0_outro.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if_block1.d();
    			if (detaching && div3_outro) div3_outro.end();
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
    	let $newProfile;
    	let $subWindowStatus;
    	let $addToggleComplete;
    	let $editProfile;
    	let $selectedProfile;
    	let $addToggle;
    	let $pageIndex;
    	validate_store(newProfile, 'newProfile');
    	component_subscribe($$self, newProfile, $$value => $$invalidate(10, $newProfile = $$value));
    	validate_store(subWindowStatus, 'subWindowStatus');
    	component_subscribe($$self, subWindowStatus, $$value => $$invalidate(1, $subWindowStatus = $$value));
    	validate_store(addToggleComplete, 'addToggleComplete');
    	component_subscribe($$self, addToggleComplete, $$value => $$invalidate(11, $addToggleComplete = $$value));
    	validate_store(editProfile, 'editProfile');
    	component_subscribe($$self, editProfile, $$value => $$invalidate(12, $editProfile = $$value));
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(13, $selectedProfile = $$value));
    	validate_store(addToggle, 'addToggle');
    	component_subscribe($$self, addToggle, $$value => $$invalidate(14, $addToggle = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(15, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SubWindow', slots, []);
    	let subWindowButtonDisabled = false;

    	if ($subWindowStatus != 10) if ($pageIndex == 1) {
    		set_store_value(
    			newProfile,
    			$newProfile = {
    				Name: { First: "", Last: "" },
    				Occupation: "",
    				LoggedIn: false,
    				Images: { First: "", Second: "" }
    			},
    			$newProfile
    		);
    	} else {
    		set_store_value(
    			newProfile,
    			$newProfile = {
    				Name: { First: "", Last: "" },
    				Student: { Course: "", Year: "", Section: "" },
    				LoggedIn: false,
    				Images: { First: "", Second: "" }
    			},
    			$newProfile
    		);
    	}

    	let switchState = () => {
    		set_store_value(addToggle, $addToggle = !$addToggle, $addToggle);
    	};

    	let switchPageAdd = () => {
    		if ($subWindowStatus == 5 || $subWindowStatus == 6) {
    			if ($editProfile != "") {
    				set_store_value(selectedProfile, $selectedProfile = $editProfile, $selectedProfile);
    			}

    			set_store_value(addToggleComplete, $addToggleComplete = !$addToggleComplete, $addToggleComplete);
    			switchState();
    		} else {
    			subWindowStatus.set($subWindowStatus + 1);
    			$$invalidate(0, subWindowButtonDisabled = true);
    		}
    	};

    	let switchPageRemove = () => {
    		subWindowStatus.set($subWindowStatus - 1);
    		$$invalidate(0, subWindowButtonDisabled = false);
    	};

    	let saveButton = () => {
    		subWindowStatus.set(4);
    		$$invalidate(0, subWindowButtonDisabled = true);
    	};

    	onDestroy(() => {
    		set_store_value(subWindowStatus, $subWindowStatus = 0, $subWindowStatus);
    		set_store_value(newProfile, $newProfile = "", $newProfile);
    		$$invalidate(0, subWindowButtonDisabled = undefined);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SubWindow> was created with unknown prop '${key}'`);
    	});

    	function subwindowform2_subWindowButtonDisabled_binding(value) {
    		subWindowButtonDisabled = value;
    		$$invalidate(0, subWindowButtonDisabled);
    	}

    	function subwindowform3_subWindowButtonDisabled_binding(value) {
    		subWindowButtonDisabled = value;
    		$$invalidate(0, subWindowButtonDisabled);
    	}

    	function subwindowform4_subWindowButtonDisabled_binding(value) {
    		subWindowButtonDisabled = value;
    		$$invalidate(0, subWindowButtonDisabled);
    	}

    	function subwindowformstatusreq_subWindowButtonDisabled_binding(value) {
    		subWindowButtonDisabled = value;
    		$$invalidate(0, subWindowButtonDisabled);
    	}

    	$$self.$capture_state = () => ({
    		fly,
    		fade,
    		addToggle,
    		addToggleComplete,
    		subWindowStatus,
    		pageIndex,
    		newProfile,
    		editProfile,
    		selectedProfile,
    		onDestroy,
    		SubWindowForm1,
    		SubWindowForm2,
    		SubWindowForm3,
    		SubWindowForm4,
    		SubWindowFormStatusReq,
    		SubWindowFormStatusRes,
    		SubWindowFormEdit,
    		subWindowButtonDisabled,
    		switchState,
    		switchPageAdd,
    		switchPageRemove,
    		saveButton,
    		$newProfile,
    		$subWindowStatus,
    		$addToggleComplete,
    		$editProfile,
    		$selectedProfile,
    		$addToggle,
    		$pageIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('subWindowButtonDisabled' in $$props) $$invalidate(0, subWindowButtonDisabled = $$props.subWindowButtonDisabled);
    		if ('switchState' in $$props) $$invalidate(2, switchState = $$props.switchState);
    		if ('switchPageAdd' in $$props) $$invalidate(3, switchPageAdd = $$props.switchPageAdd);
    		if ('switchPageRemove' in $$props) $$invalidate(4, switchPageRemove = $$props.switchPageRemove);
    		if ('saveButton' in $$props) $$invalidate(5, saveButton = $$props.saveButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		subWindowButtonDisabled,
    		$subWindowStatus,
    		switchState,
    		switchPageAdd,
    		switchPageRemove,
    		saveButton,
    		subwindowform2_subWindowButtonDisabled_binding,
    		subwindowform3_subWindowButtonDisabled_binding,
    		subwindowform4_subWindowButtonDisabled_binding,
    		subwindowformstatusreq_subWindowButtonDisabled_binding
    	];
    }

    class SubWindow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubWindow",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\StudentCard.svelte generated by Svelte v3.44.2 */
    const file$7 = "src\\components\\StudentCard.svelte";

    // (18:4) {:else}
    function create_else_block$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21");
    			add_location(path, file$7, 19, 8, 1164);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "cross h-14 w-full rounded-l-xl custom-bg-red");
    			set_style(svg, "stroke", "black");
    			set_style(svg, "stroke-width", ".25px");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$7, 18, 6, 986);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(18:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if student.LoggedIn}
    function create_if_block$5(ctx) {
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
    			add_location(path0, file$7, 14, 8, 670);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z");
    			add_location(path1, file$7, 15, 8, 772);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "check h-14 w-full rounded-l-xl custom-bg-blue");
    			set_style(svg, "stroke", "black");
    			set_style(svg, "stroke-width", ".25px");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$7, 13, 6, 491);
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(13:4) {#if student.LoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p0;
    	let t1_value = /*student*/ ctx[0].Name.Last + "";
    	let t1;
    	let t2;
    	let t3_value = /*student*/ ctx[0].Name.First + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*student*/ ctx[0].Student.Course + "";
    	let t5;
    	let t6;
    	let t7_value = /*student*/ ctx[0].Student.Year + "";
    	let t7;
    	let t8;
    	let t9_value = /*student*/ ctx[0].Student.Section + "";
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
    		if (/*student*/ ctx[0].LoggedIn) return create_if_block$5;
    		return create_else_block$2;
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
    			t2 = text(", ");
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
    			attr_dev(div0, "class", "rounded-l-xl md:w-24 w-20 flex justify-center items-center");
    			add_location(div0, file$7, 11, 2, 382);
    			attr_dev(p0, "class", "font-light");
    			add_location(p0, file$7, 25, 4, 1637);
    			attr_dev(p1, "class", "font-light text-gray-500");
    			add_location(p1, file$7, 26, 4, 1710);
    			attr_dev(div1, "class", "ml-2 overflow-hidden whitespace-nowrap overflow-ellipsis");
    			add_location(div1, file$7, 24, 2, 1561);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M9 5l7 7-7 7");
    			add_location(path, file$7, 31, 6, 2101);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-8 bg-transparent svelte-labxiy");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			toggle_class(svg, "check", /*student*/ ctx[0].LoggedIn);
    			toggle_class(svg, "cross", !/*student*/ ctx[0].LoggedIn);
    			add_location(svg, file$7, 30, 4, 1931);
    			attr_dev(button, "class", "w-16 h-full flex justify-center items-center svelte-labxiy");
    			add_location(button, file$7, 29, 2, 1839);
    			attr_dev(div2, "class", "card grid max-w-3xl mb-3 h-14 w-full rounded-xl items-center z-10 svelte-labxiy");
    			add_location(div2, file$7, 10, 0, 223);
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
    				dispose = listen_dev(button, "click", /*selectProfile*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if ((!current || dirty & /*student*/ 1) && t1_value !== (t1_value = /*student*/ ctx[0].Name.Last + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*student*/ 1) && t3_value !== (t3_value = /*student*/ ctx[0].Name.First + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*student*/ 1) && t5_value !== (t5_value = /*student*/ ctx[0].Student.Course + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*student*/ 1) && t7_value !== (t7_value = /*student*/ ctx[0].Student.Year + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*student*/ 1) && t9_value !== (t9_value = /*student*/ ctx[0].Student.Section + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*student*/ 1) {
    				toggle_class(svg, "check", /*student*/ ctx[0].LoggedIn);
    			}

    			if (dirty & /*student*/ 1) {
    				toggle_class(svg, "cross", !/*student*/ ctx[0].LoggedIn);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, fly, { delay: 500, y: -50, duration: 200 });
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $selectedProfile;
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(2, $selectedProfile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StudentCard', slots, []);
    	let { student } = $$props;

    	let selectProfile = () => {
    		set_store_value(selectedProfile, $selectedProfile = student, $selectedProfile);
    	};

    	const writable_props = ['student'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StudentCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('student' in $$props) $$invalidate(0, student = $$props.student);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		fade,
    		selectedProfile,
    		student,
    		selectProfile,
    		$selectedProfile
    	});

    	$$self.$inject_state = $$props => {
    		if ('student' in $$props) $$invalidate(0, student = $$props.student);
    		if ('selectProfile' in $$props) $$invalidate(1, selectProfile = $$props.selectProfile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [student, selectProfile];
    }

    class StudentCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { student: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentCard",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*student*/ ctx[0] === undefined && !('student' in props)) {
    			console.warn("<StudentCard> was created without expected prop 'student'");
    		}
    	}

    	get student() {
    		throw new Error("<StudentCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set student(value) {
    		throw new Error("<StudentCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Searchbar.svelte generated by Svelte v3.44.2 */
    const file$6 = "src\\components\\Searchbar.svelte";

    function create_fragment$6(ctx) {
    	let input;
    	let input_intro;
    	let input_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "text-center font-light h-8 max-w-xl w-full my-4 sticky top-4 rounded-full custom-bg-white z-20 svelte-1tg9l2s");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Type to search...");
    			add_location(input, file$6, 9, 0, 223);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$searchValue*/ ctx[0]);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$searchValue*/ 1 && input.value !== /*$searchValue*/ ctx[0]) {
    				set_input_value(input, /*$searchValue*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (input_outro) input_outro.end(1);
    				input_intro = create_in_transition(input, fly, { delay: 200, y: -50, duration: 200 });
    				input_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (input_intro) input_intro.invalidate();
    			input_outro = create_out_transition(input, fly, { y: -50, duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching && input_outro) input_outro.end();
    			mounted = false;
    			dispose();
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
    	let $searchIndex;
    	let $searchValue;
    	validate_store(searchIndex, 'searchIndex');
    	component_subscribe($$self, searchIndex, $$value => $$invalidate(2, $searchIndex = $$value));
    	validate_store(searchValue, 'searchValue');
    	component_subscribe($$self, searchValue, $$value => $$invalidate(0, $searchValue = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Searchbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Searchbar> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		$searchValue = this.value;
    		searchValue.set($searchValue);
    	}

    	$$self.$capture_state = () => ({
    		fly,
    		searchValue,
    		searchIndex,
    		$searchIndex,
    		$searchValue
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$searchValue*/ 1) {
    			if ($searchValue) {
    				set_store_value(searchIndex, $searchIndex = 0, $searchIndex);
    			}
    		}
    	};

    	return [$searchValue, input_input_handler];
    }

    class Searchbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Searchbar",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\routes\Student.svelte generated by Svelte v3.44.2 */
    const file$5 = "src\\routes\\Student.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (20:37) 
    function create_if_block_1$3(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1$1,
    		then: create_then_block_1$1,
    		catch: create_catch_block_1$1,
    		value: 4,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$searchResults*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$searchResults*/ 4 && promise !== (promise = /*$searchResults*/ ctx[2]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(20:37) ",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if $searchValue == "" || $searchValue.length < 2}
    function create_if_block$4(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 4,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$studentData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$studentData*/ 2 && promise !== (promise = /*$studentData*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:2) {#if $searchValue == \\\"\\\" || $searchValue.length < 2}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { studentData }
    function create_catch_block_1$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1$1.name,
    		type: "catch",
    		source: "(1:0) <script>    import { studentData }",
    		ctx
    	});

    	return block;
    }

    // (21:44)         {#each studentData.queryResults as student (student._id)}
    function create_then_block_1$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*studentData*/ ctx[4].queryResults;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*student*/ ctx[5]._id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
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
    			if (dirty & /*$searchResults*/ 4) {
    				each_value_1 = /*studentData*/ ctx[4].queryResults;
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1$1, each_1_anchor, get_each_context_1$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    		id: create_then_block_1$1.name,
    		type: "then",
    		source: "(21:44)         {#each studentData.queryResults as student (student._id)}",
    		ctx
    	});

    	return block;
    }

    // (22:6) {#each studentData.queryResults as student (student._id)}
    function create_each_block_1$1(key_1, ctx) {
    	let first;
    	let studentcard;
    	let current;

    	studentcard = new StudentCard({
    			props: { student: /*student*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(studentcard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(studentcard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const studentcard_changes = {};
    			if (dirty & /*$searchResults*/ 4) studentcard_changes.student = /*student*/ ctx[5];
    			studentcard.$set(studentcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(studentcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(studentcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(studentcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(22:6) {#each studentData.queryResults as student (student._id)}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { studentData }
    function create_pending_block_1$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1$1.name,
    		type: "pending",
    		source: "(1:0) <script>    import { studentData }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { studentData }
    function create_catch_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>    import { studentData }",
    		ctx
    	});

    	return block;
    }

    // (15:42)         {#each studentData as student (student._id)}
    function create_then_block$2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*studentData*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*student*/ ctx[5]._id;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
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
    			if (dirty & /*$studentData*/ 2) {
    				each_value = /*studentData*/ ctx[4];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$2, each_1_anchor, get_each_context$2);
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
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(15:42)         {#each studentData as student (student._id)}",
    		ctx
    	});

    	return block;
    }

    // (16:6) {#each studentData as student (student._id)}
    function create_each_block$2(key_1, ctx) {
    	let first;
    	let studentcard;
    	let current;

    	studentcard = new StudentCard({
    			props: { student: /*student*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(studentcard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(studentcard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const studentcard_changes = {};
    			if (dirty & /*$studentData*/ 2) studentcard_changes.student = /*student*/ ctx[5];
    			studentcard.$set(studentcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(studentcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(studentcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(studentcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(16:6) {#each studentData as student (student._id)}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { studentData }
    function create_pending_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(1:0) <script>    import { studentData }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let searchbar;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	searchbar = new Searchbar({ $$inline: true });
    	const if_block_creators = [create_if_block$4, create_if_block_1$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$searchValue*/ ctx[0] == "" || /*$searchValue*/ ctx[0].length < 2) return 0;
    		if (/*$searchValue*/ ctx[0].length >= 2) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(searchbar.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "flex md:mb-24 mb-16 mx-5 items-center flex-col");
    			add_location(div, file$5, 11, 0, 381);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(searchbar, div, null);
    			append_dev(div, t);

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
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(searchbar);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
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
    	let $searchValue;
    	let $employeeCurrentIndex;
    	let $studentData;
    	let $searchResults;
    	validate_store(searchValue, 'searchValue');
    	component_subscribe($$self, searchValue, $$value => $$invalidate(0, $searchValue = $$value));
    	validate_store(employeeCurrentIndex, 'employeeCurrentIndex');
    	component_subscribe($$self, employeeCurrentIndex, $$value => $$invalidate(3, $employeeCurrentIndex = $$value));
    	validate_store(studentData, 'studentData');
    	component_subscribe($$self, studentData, $$value => $$invalidate(1, $studentData = $$value));
    	validate_store(searchResults, 'searchResults');
    	component_subscribe($$self, searchResults, $$value => $$invalidate(2, $searchResults = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Student', slots, []);
    	set_store_value(employeeCurrentIndex, $employeeCurrentIndex = 1, $employeeCurrentIndex);
    	set_store_value(searchValue, $searchValue = "", $searchValue);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Student> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		studentData,
    		employeeCurrentIndex,
    		searchValue,
    		searchResults,
    		StudentCard,
    		Searchbar,
    		$searchValue,
    		$employeeCurrentIndex,
    		$studentData,
    		$searchResults
    	});

    	return [$searchValue, $studentData, $searchResults];
    }

    class Student extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Student",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\EmployeeCard.svelte generated by Svelte v3.44.2 */
    const file$4 = "src\\components\\EmployeeCard.svelte";

    // (18:4) {:else}
    function create_else_block$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21");
    			add_location(path, file$4, 19, 8, 1167);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "cross h-14 w-full rounded-l-xl custom-bg-red");
    			set_style(svg, "stroke", "black");
    			set_style(svg, "stroke-width", ".25px");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$4, 18, 6, 989);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(18:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if employee.LoggedIn}
    function create_if_block$3(ctx) {
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
    			add_location(path0, file$4, 14, 8, 673);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z");
    			add_location(path1, file$4, 15, 8, 775);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "check h-14 w-full rounded-l-xl custom-bg-blue");
    			set_style(svg, "stroke", "black");
    			set_style(svg, "stroke-width", ".25px");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$4, 13, 6, 494);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(13:4) {#if employee.LoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p0;
    	let t1_value = /*employee*/ ctx[0].Name.Last + "";
    	let t1;
    	let t2;
    	let t3_value = /*employee*/ ctx[0].Name.First + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*employee*/ ctx[0].Occupation + "";
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
    		if (/*employee*/ ctx[0].LoggedIn) return create_if_block$3;
    		return create_else_block$1;
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
    			t2 = text(", ");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(div0, "class", "rounded-l-xl md:w-24 w-20 flex justify-center items-center");
    			add_location(div0, file$4, 11, 2, 384);
    			attr_dev(p0, "class", "font-light");
    			add_location(p0, file$4, 25, 4, 1640);
    			attr_dev(p1, "class", "font-light text-gray-500");
    			add_location(p1, file$4, 26, 4, 1715);
    			attr_dev(div1, "class", "ml-2 overflow-hidden whitespace-nowrap overflow-ellipsis");
    			add_location(div1, file$4, 24, 2, 1564);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M9 5l7 7-7 7");
    			add_location(path, file$4, 31, 6, 2056);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-8 bg-transparent svelte-labxiy");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			toggle_class(svg, "check", /*employee*/ ctx[0].LoggedIn);
    			toggle_class(svg, "cross", !/*employee*/ ctx[0].LoggedIn);
    			add_location(svg, file$4, 30, 4, 1884);
    			attr_dev(button, "class", "w-16 h-full flex justify-center items-center svelte-labxiy");
    			add_location(button, file$4, 29, 2, 1792);
    			attr_dev(div2, "class", "card grid max-w-3xl mb-3 h-14 w-full rounded-xl items-center z-10 svelte-labxiy");
    			add_location(div2, file$4, 10, 0, 225);
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
    				dispose = listen_dev(button, "click", /*selectProfile*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if ((!current || dirty & /*employee*/ 1) && t1_value !== (t1_value = /*employee*/ ctx[0].Name.Last + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*employee*/ 1) && t3_value !== (t3_value = /*employee*/ ctx[0].Name.First + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*employee*/ 1) && t5_value !== (t5_value = /*employee*/ ctx[0].Occupation + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*employee*/ 1) {
    				toggle_class(svg, "check", /*employee*/ ctx[0].LoggedIn);
    			}

    			if (dirty & /*employee*/ 1) {
    				toggle_class(svg, "cross", !/*employee*/ ctx[0].LoggedIn);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				div2_intro = create_in_transition(div2, fly, { delay: 500, y: -50, duration: 200 });
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $selectedProfile;
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(2, $selectedProfile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EmployeeCard', slots, []);
    	let { employee } = $$props;

    	let selectProfile = () => {
    		set_store_value(selectedProfile, $selectedProfile = employee, $selectedProfile);
    	};

    	const writable_props = ['employee'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EmployeeCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('employee' in $$props) $$invalidate(0, employee = $$props.employee);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		fade,
    		selectedProfile,
    		employee,
    		selectProfile,
    		$selectedProfile
    	});

    	$$self.$inject_state = $$props => {
    		if ('employee' in $$props) $$invalidate(0, employee = $$props.employee);
    		if ('selectProfile' in $$props) $$invalidate(1, selectProfile = $$props.selectProfile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [employee, selectProfile];
    }

    class EmployeeCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { employee: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmployeeCard",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*employee*/ ctx[0] === undefined && !('employee' in props)) {
    			console.warn("<EmployeeCard> was created without expected prop 'employee'");
    		}
    	}

    	get employee() {
    		throw new Error("<EmployeeCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set employee(value) {
    		throw new Error("<EmployeeCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Employee.svelte generated by Svelte v3.44.2 */
    const file$3 = "src\\routes\\Employee.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (20:37) 
    function create_if_block_1$2(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 4,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$searchResults*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$searchResults*/ 4 && promise !== (promise = /*$searchResults*/ ctx[2]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(20:37) ",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if $searchValue == "" || $searchValue.length < 2}
    function create_if_block$2(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 4,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$employeeData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$employeeData*/ 2 && promise !== (promise = /*$employeeData*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(14:2) {#if $searchValue == \\\"\\\" || $searchValue.length < 2}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { employeeData }
    function create_catch_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>    import { employeeData }",
    		ctx
    	});

    	return block;
    }

    // (21:45)         {#each employeeData.queryResults as employee (employee._id)}
    function create_then_block_1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*employeeData*/ ctx[4].queryResults;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*employee*/ ctx[5]._id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
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
    			if (dirty & /*$searchResults*/ 4) {
    				each_value_1 = /*employeeData*/ ctx[4].queryResults;
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(21:45)         {#each employeeData.queryResults as employee (employee._id)}",
    		ctx
    	});

    	return block;
    }

    // (22:6) {#each employeeData.queryResults as employee (employee._id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let employeecard;
    	let current;

    	employeecard = new EmployeeCard({
    			props: { employee: /*employee*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(employeecard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(employeecard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const employeecard_changes = {};
    			if (dirty & /*$searchResults*/ 4) employeecard_changes.employee = /*employee*/ ctx[5];
    			employeecard.$set(employeecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(employeecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(employeecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(employeecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(22:6) {#each employeeData.queryResults as employee (employee._id)}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { employeeData }
    function create_pending_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <script>    import { employeeData }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { employeeData }
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>    import { employeeData }",
    		ctx
    	});

    	return block;
    }

    // (15:44)         {#each employeeData as employee (employee._id)}
    function create_then_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*employeeData*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*employee*/ ctx[5]._id;
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
    			if (dirty & /*$employeeData*/ 2) {
    				each_value = /*employeeData*/ ctx[4];
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
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(15:44)         {#each employeeData as employee (employee._id)}",
    		ctx
    	});

    	return block;
    }

    // (16:6) {#each employeeData as employee (employee._id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let employeecard;
    	let current;

    	employeecard = new EmployeeCard({
    			props: { employee: /*employee*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(employeecard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(employeecard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const employeecard_changes = {};
    			if (dirty & /*$employeeData*/ 2) employeecard_changes.employee = /*employee*/ ctx[5];
    			employeecard.$set(employeecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(employeecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(employeecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(employeecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(16:6) {#each employeeData as employee (employee._id)}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { employeeData }
    function create_pending_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(1:0) <script>    import { employeeData }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let searchbar;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	searchbar = new Searchbar({ $$inline: true });
    	const if_block_creators = [create_if_block$2, create_if_block_1$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$searchValue*/ ctx[0] == "" || /*$searchValue*/ ctx[0].length < 2) return 0;
    		if (/*$searchValue*/ ctx[0].length >= 2) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(searchbar.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "flex md:mb-24 mb-16 mx-5 items-center flex-col");
    			add_location(div, file$3, 11, 0, 380);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(searchbar, div, null);
    			append_dev(div, t);

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
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(searchbar);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
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
    	let $searchValue;
    	let $studentCurrentIndex;
    	let $employeeData;
    	let $searchResults;
    	validate_store(searchValue, 'searchValue');
    	component_subscribe($$self, searchValue, $$value => $$invalidate(0, $searchValue = $$value));
    	validate_store(studentCurrentIndex, 'studentCurrentIndex');
    	component_subscribe($$self, studentCurrentIndex, $$value => $$invalidate(3, $studentCurrentIndex = $$value));
    	validate_store(employeeData, 'employeeData');
    	component_subscribe($$self, employeeData, $$value => $$invalidate(1, $employeeData = $$value));
    	validate_store(searchResults, 'searchResults');
    	component_subscribe($$self, searchResults, $$value => $$invalidate(2, $searchResults = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Employee', slots, []);
    	set_store_value(studentCurrentIndex, $studentCurrentIndex = 1, $studentCurrentIndex);
    	set_store_value(searchValue, $searchValue = "", $searchValue);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Employee> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		employeeData,
    		studentCurrentIndex,
    		searchValue,
    		searchResults,
    		EmployeeCard,
    		Searchbar,
    		$searchValue,
    		$studentCurrentIndex,
    		$employeeData,
    		$searchResults
    	});

    	return [$searchValue, $employeeData, $searchResults];
    }

    class Employee extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Employee",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\AttendanceCard.svelte generated by Svelte v3.44.2 */
    const file$2 = "src\\components\\AttendanceCard.svelte";

    function create_fragment$2(ctx) {
    	let tr;
    	let td0;

    	let t0_value = (/*attendance*/ ctx[0].LoggedIn
    	? "Logged In"
    	: "Logged Out") + "";

    	let t0;
    	let td0_intro;
    	let td0_outro;
    	let t1;
    	let td1;
    	let t2_value = /*attendance*/ ctx[0].Via + "";
    	let t2;
    	let td1_intro;
    	let td1_outro;
    	let t3;
    	let td2;
    	let t4_value = /*attendance*/ ctx[0].Date.Day + "";
    	let t4;
    	let t5;
    	let t6_value = /*attendance*/ ctx[0].Date.Month + "";
    	let t6;
    	let t7;
    	let t8_value = /*attendance*/ ctx[0].Date.Year + "";
    	let t8;
    	let td2_intro;
    	let td2_outro;
    	let t9;
    	let td3;
    	let t10_value = /*attendance*/ ctx[0].Time.Hour + "";
    	let t10;
    	let t11;
    	let t12_value = /*attendance*/ ctx[0].Time.Minute + "";
    	let t12;
    	let t13;
    	let t14_value = /*attendance*/ ctx[0].Time.Second + "";
    	let t14;
    	let td3_intro;
    	let td3_outro;
    	let current;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = text("-");
    			t6 = text(t6_value);
    			t7 = text("-");
    			t8 = text(t8_value);
    			t9 = space();
    			td3 = element("td");
    			t10 = text(t10_value);
    			t11 = text(":");
    			t12 = text(t12_value);
    			t13 = text(":");
    			t14 = text(t14_value);
    			attr_dev(td0, "class", "px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-red");
    			add_location(td0, file$2, 6, 2, 107);
    			attr_dev(td1, "class", "px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-blue");
    			add_location(td1, file$2, 7, 2, 343);
    			attr_dev(td2, "class", "px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-red");
    			add_location(td2, file$2, 8, 2, 546);
    			attr_dev(td3, "class", "px-4 py-2 border-b border-r border-l border-black border-dashed font-light custom-bg-blue");
    			add_location(td3, file$2, 9, 2, 800);
    			add_location(tr, file$2, 5, 0, 99);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(td2, t5);
    			append_dev(td2, t6);
    			append_dev(td2, t7);
    			append_dev(td2, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td3);
    			append_dev(td3, t10);
    			append_dev(td3, t11);
    			append_dev(td3, t12);
    			append_dev(td3, t13);
    			append_dev(td3, t14);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*attendance*/ 1) && t0_value !== (t0_value = (/*attendance*/ ctx[0].LoggedIn
    			? "Logged In"
    			: "Logged Out") + "")) set_data_dev(t0, t0_value);

    			if ((!current || dirty & /*attendance*/ 1) && t2_value !== (t2_value = /*attendance*/ ctx[0].Via + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*attendance*/ 1) && t4_value !== (t4_value = /*attendance*/ ctx[0].Date.Day + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*attendance*/ 1) && t6_value !== (t6_value = /*attendance*/ ctx[0].Date.Month + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*attendance*/ 1) && t8_value !== (t8_value = /*attendance*/ ctx[0].Date.Year + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*attendance*/ 1) && t10_value !== (t10_value = /*attendance*/ ctx[0].Time.Hour + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty & /*attendance*/ 1) && t12_value !== (t12_value = /*attendance*/ ctx[0].Time.Minute + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty & /*attendance*/ 1) && t14_value !== (t14_value = /*attendance*/ ctx[0].Time.Second + "")) set_data_dev(t14, t14_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (td0_outro) td0_outro.end(1);
    				td0_intro = create_in_transition(td0, fly, { delay: 500, y: -50, duration: 200 });
    				td0_intro.start();
    			});

    			add_render_callback(() => {
    				if (td1_outro) td1_outro.end(1);
    				td1_intro = create_in_transition(td1, fly, { delay: 500, y: -50, duration: 200 });
    				td1_intro.start();
    			});

    			add_render_callback(() => {
    				if (td2_outro) td2_outro.end(1);
    				td2_intro = create_in_transition(td2, fly, { delay: 500, y: -50, duration: 200 });
    				td2_intro.start();
    			});

    			add_render_callback(() => {
    				if (td3_outro) td3_outro.end(1);
    				td3_intro = create_in_transition(td3, fly, { delay: 500, y: -50, duration: 200 });
    				td3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (td0_intro) td0_intro.invalidate();
    			td0_outro = create_out_transition(td0, fade, { duration: 200 });
    			if (td1_intro) td1_intro.invalidate();
    			td1_outro = create_out_transition(td1, fade, { duration: 200 });
    			if (td2_intro) td2_intro.invalidate();
    			td2_outro = create_out_transition(td2, fade, { duration: 200 });
    			if (td3_intro) td3_intro.invalidate();
    			td3_outro = create_out_transition(td3, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (detaching && td0_outro) td0_outro.end();
    			if (detaching && td1_outro) td1_outro.end();
    			if (detaching && td2_outro) td2_outro.end();
    			if (detaching && td3_outro) td3_outro.end();
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
    	validate_slots('AttendanceCard', slots, []);
    	let { attendance } = $$props;
    	const writable_props = ['attendance'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AttendanceCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('attendance' in $$props) $$invalidate(0, attendance = $$props.attendance);
    	};

    	$$self.$capture_state = () => ({ fly, fade, attendance });

    	$$self.$inject_state = $$props => {
    		if ('attendance' in $$props) $$invalidate(0, attendance = $$props.attendance);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [attendance];
    }

    class AttendanceCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { attendance: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AttendanceCard",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*attendance*/ ctx[0] === undefined && !('attendance' in props)) {
    			console.warn("<AttendanceCard> was created without expected prop 'attendance'");
    		}
    	}

    	get attendance() {
    		throw new Error("<AttendanceCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attendance(value) {
    		throw new Error("<AttendanceCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Profile.svelte generated by Svelte v3.44.2 */
    const file$1 = "src\\routes\\Profile.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (67:0) {#if $selectedProfile}
    function create_if_block$1(ctx) {
    	let div3;
    	let h1;
    	let t0_value = /*$selectedProfile*/ ctx[3].Name.Last + "";
    	let t0;
    	let t1;
    	let t2_value = /*$selectedProfile*/ ctx[3].Name.First + "";
    	let t2;
    	let t3;
    	let h2;
    	let t4_value = (/*$selectedProfile*/ ctx[3].Occupation || /*$selectedProfile*/ ctx[3].Student.Course + " " + /*$selectedProfile*/ ctx[3].Student.Year + "-" + /*$selectedProfile*/ ctx[3].Student.Section) + "";
    	let t4;
    	let t5;
    	let div2;
    	let button;
    	let t7;
    	let div0;
    	let t8;
    	let div1;
    	let t9;
    	let promise;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*deleteAsk*/ ctx[1]) return create_if_block_3$1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*historyAsk*/ ctx[2]) return create_if_block_2$1;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 19,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$selectedProfileData*/ ctx[4], info);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			t3 = space();
    			h2 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Edit Profile";
    			t7 = space();
    			div0 = element("div");
    			if_block0.c();
    			t8 = space();
    			div1 = element("div");
    			if_block1.c();
    			t9 = space();
    			info.block.c();
    			attr_dev(h1, "class", "bg-transparent text-center font-light mx-5 text-5xl");
    			add_location(h1, file$1, 68, 4, 2227);
    			attr_dev(h2, "class", "bg-transparent text-center font-light mx-5 text-xl mt-2");
    			add_location(h2, file$1, 69, 4, 2361);
    			attr_dev(button, "class", "sm:w-40 w-4/6 rounded-full mx-2 py-0.5 font-light my-1 sm:my-0 svelte-42nial");
    			set_style(button, "background", "#efefef");
    			add_location(button, file$1, 71, 6, 2685);
    			attr_dev(div0, "class", "bg-transparent mx-2 sm:w-40 w-4/6 flex flex-row py-0.5 my-1 sm:my-0");
    			set_style(div0, "transition", "150ms ease-in-out");
    			add_location(div0, file$1, 72, 6, 2844);
    			attr_dev(div1, "class", "bg-transparent mx-2 sm:w-40 w-4/6 flex flex-row py-0.5 my-1 sm:my-0");
    			set_style(div1, "transition", "150ms ease-in-out");
    			add_location(div1, file$1, 80, 6, 3459);
    			attr_dev(div2, "class", "bg-transparent flex w-full justify-center sm:flex-row flex-col mt-3 items-center");
    			add_location(div2, file$1, 70, 4, 2583);
    			attr_dev(div3, "class", "flex justify-center items-center flex-col my-5");
    			add_location(div3, file$1, 67, 2, 2085);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div3, t3);
    			append_dev(div3, h2);
    			append_dev(h2, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(div2, t7);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div2, t8);
    			append_dev(div2, div1);
    			if_block1.m(div1, null);
    			append_dev(div3, t9);
    			info.block.m(div3, info.anchor = null);
    			info.mount = () => div3;
    			info.anchor = null;
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*editProfile*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*$selectedProfile*/ 8) && t0_value !== (t0_value = /*$selectedProfile*/ ctx[3].Name.Last + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$selectedProfile*/ 8) && t2_value !== (t2_value = /*$selectedProfile*/ ctx[3].Name.First + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*$selectedProfile*/ 8) && t4_value !== (t4_value = (/*$selectedProfile*/ ctx[3].Occupation || /*$selectedProfile*/ ctx[3].Student.Course + " " + /*$selectedProfile*/ ctx[3].Student.Year + "-" + /*$selectedProfile*/ ctx[3].Student.Section) + "")) set_data_dev(t4, t4_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}

    			info.ctx = ctx;

    			if (dirty & /*$selectedProfileData*/ 16 && promise !== (promise = /*$selectedProfileData*/ ctx[4]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);

    			add_render_callback(() => {
    				if (div3_outro) div3_outro.end(1);
    				div3_intro = create_in_transition(div3, fly, { delay: 500, y: -50, duration: 200 });
    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			if (div3_intro) div3_intro.invalidate();
    			div3_outro = create_out_transition(div3, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block0.d();
    			if_block1.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching && div3_outro) div3_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(67:0) {#if $selectedProfile}",
    		ctx
    	});

    	return block;
    }

    // (77:8) {:else}
    function create_else_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Delete Profile";
    			attr_dev(button, "class", "danger w-full rounded-full font-light svelte-42nial");
    			set_style(button, "background", "#efefef");
    			add_location(button, file$1, 77, 10, 3289);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*deleteProfileAsk*/ ctx[6], false, false, false);
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
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(77:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:8) {#if deleteAsk}
    function create_if_block_3$1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "No";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Yes";
    			attr_dev(button0, "class", "w-full rounded-full mr-2 font-light svelte-42nial");
    			set_style(button0, "background", "#efefef");
    			add_location(button0, file$1, 74, 10, 3000);
    			attr_dev(button1, "class", "danger w-full rounded-full font-light svelte-42nial");
    			set_style(button1, "background", "#efefef");
    			add_location(button1, file$1, 75, 10, 3134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*deleteProfileCancel*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*deleteProfileProceed*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(74:8) {#if deleteAsk}",
    		ctx
    	});

    	return block;
    }

    // (85:8) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Delete History";
    			attr_dev(button, "class", "danger w-full rounded-full font-light svelte-42nial");
    			set_style(button, "background", "#efefef");
    			add_location(button, file$1, 85, 10, 3898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*deleteHistoryAsk*/ ctx[9], false, false, false);
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(85:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:8) {#if historyAsk}
    function create_if_block_2$1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "No";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Yes";
    			attr_dev(button0, "class", "w-full rounded-full mr-2 font-light svelte-42nial");
    			set_style(button0, "background", "#efefef");
    			add_location(button0, file$1, 82, 10, 3616);
    			attr_dev(button1, "class", "danger w-full rounded-full font-light svelte-42nial");
    			set_style(button1, "background", "#efefef");
    			add_location(button1, file$1, 83, 10, 3750);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*deleteHistoryCancel*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*deleteHistory*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(82:8) {#if historyAsk}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { selectedProfile, selectedProfileData, selectedProfileCurrentIndex }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>    import { selectedProfile, selectedProfileData, selectedProfileCurrentIndex }",
    		ctx
    	});

    	return block;
    }

    // (91:50)         {#if profileData.length != 0 && notYetDeleted}
    function create_then_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*profileData*/ ctx[19].length != 0 && /*notYetDeleted*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

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
    		id: create_then_block.name,
    		type: "then",
    		source: "(91:50)         {#if profileData.length != 0 && notYetDeleted}",
    		ctx
    	});

    	return block;
    }

    // (104:6) {:else}
    function create_else_block(ctx) {
    	let h1;
    	let t0_value = /*$selectedProfile*/ ctx[3].Name.First + "";
    	let t0;
    	let t1;
    	let h1_intro;
    	let h1_outro;
    	let current;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = text(" currently has no record, please check again later.");
    			attr_dev(h1, "class", "bg-transparent mt-9 text-2xl font-light mx-5 text-center");
    			add_location(h1, file$1, 104, 8, 5340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$selectedProfile*/ 8) && t0_value !== (t0_value = /*$selectedProfile*/ ctx[3].Name.First + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (h1_outro) h1_outro.end(1);
    				h1_intro = create_in_transition(h1, fly, { delay: 500, y: -50, duration: 200 });
    				h1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (h1_intro) h1_intro.invalidate();
    			h1_outro = create_out_transition(h1, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching && h1_outro) h1_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(104:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (92:6) {#if profileData.length != 0 && notYetDeleted}
    function create_if_block_1$1(ctx) {
    	let table;
    	let tr;
    	let th0;
    	let th0_intro;
    	let th0_outro;
    	let t1;
    	let th1;
    	let th1_intro;
    	let th1_outro;
    	let t3;
    	let th2;
    	let th2_intro;
    	let th2_outro;
    	let t5;
    	let th3;
    	let th3_intro;
    	let th3_outro;
    	let t7;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let table_intro;
    	let table_outro;
    	let current;
    	let each_value = /*profileData*/ ctx[19];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*attendance*/ ctx[20]._id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Status";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Via";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Date DD-MM-YYYY";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Time HH:MM:SS";
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "font-medium py-2 px-4 border border-black");
    			set_style(th0, "color", "#efefef");
    			set_style(th0, "background", "#242424");
    			add_location(th0, file$1, 94, 12, 4355);
    			attr_dev(th1, "class", "font-medium py-2 px-4 border border-black");
    			set_style(th1, "color", "#efefef");
    			set_style(th1, "background", "#242424");
    			add_location(th1, file$1, 95, 12, 4555);
    			attr_dev(th2, "class", "font-medium py-2 px-4 border border-black");
    			set_style(th2, "color", "#efefef");
    			set_style(th2, "background", "#242424");
    			add_location(th2, file$1, 96, 12, 4752);
    			attr_dev(th3, "class", "font-medium py-2 px-4 border border-black");
    			set_style(th3, "color", "#efefef");
    			set_style(th3, "background", "#242424");
    			add_location(th3, file$1, 97, 12, 4961);
    			add_location(tr, file$1, 93, 10, 4337);
    			attr_dev(table, "class", "mt-5 mb-14 w-11/12 md:max-w-4xl text-center svelte-42nial");
    			add_location(table, file$1, 92, 8, 4190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(table, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selectedProfileData*/ 16) {
    				each_value = /*profileData*/ ctx[19];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, table, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (th0_outro) th0_outro.end(1);
    				th0_intro = create_in_transition(th0, fly, { delay: 500, y: -50, duration: 200 });
    				th0_intro.start();
    			});

    			add_render_callback(() => {
    				if (th1_outro) th1_outro.end(1);
    				th1_intro = create_in_transition(th1, fly, { delay: 500, y: -50, duration: 200 });
    				th1_intro.start();
    			});

    			add_render_callback(() => {
    				if (th2_outro) th2_outro.end(1);
    				th2_intro = create_in_transition(th2, fly, { delay: 500, y: -50, duration: 200 });
    				th2_intro.start();
    			});

    			add_render_callback(() => {
    				if (th3_outro) th3_outro.end(1);
    				th3_intro = create_in_transition(th3, fly, { delay: 500, y: -50, duration: 200 });
    				th3_intro.start();
    			});

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (table_outro) table_outro.end(1);
    				table_intro = create_in_transition(table, fly, { delay: 500, y: -50, duration: 200 });
    				table_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (th0_intro) th0_intro.invalidate();
    			th0_outro = create_out_transition(th0, fade, { duration: 200 });
    			if (th1_intro) th1_intro.invalidate();
    			th1_outro = create_out_transition(th1, fade, { duration: 200 });
    			if (th2_intro) th2_intro.invalidate();
    			th2_outro = create_out_transition(th2, fade, { duration: 200 });
    			if (th3_intro) th3_intro.invalidate();
    			th3_outro = create_out_transition(th3, fade, { duration: 200 });

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (table_intro) table_intro.invalidate();
    			table_outro = create_out_transition(table, fade, { duration: 200 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (detaching && th0_outro) th0_outro.end();
    			if (detaching && th1_outro) th1_outro.end();
    			if (detaching && th2_outro) th2_outro.end();
    			if (detaching && th3_outro) th3_outro.end();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && table_outro) table_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(92:6) {#if profileData.length != 0 && notYetDeleted}",
    		ctx
    	});

    	return block;
    }

    // (100:10) {#each profileData as attendance (attendance._id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let attendancecard;
    	let current;

    	attendancecard = new AttendanceCard({
    			props: { attendance: /*attendance*/ ctx[20] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(attendancecard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(attendancecard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const attendancecard_changes = {};
    			if (dirty & /*$selectedProfileData*/ 16) attendancecard_changes.attendance = /*attendance*/ ctx[20];
    			attendancecard.$set(attendancecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attendancecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attendancecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(attendancecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(100:10) {#each profileData as attendance (attendance._id)}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    import { selectedProfile, selectedProfileData, selectedProfileCurrentIndex }
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>    import { selectedProfile, selectedProfileData, selectedProfileCurrentIndex }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$selectedProfile*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedProfile*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$selectedProfile*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $selectedProfileCurrentIndex;
    	let $selectedProfile;
    	let $pageIndex;
    	let $employeeCurrentIndex;
    	let $studentCurrentIndex;
    	let $addToggle;
    	let $subWindowStatus;
    	let $selectedProfileData;
    	validate_store(selectedProfileCurrentIndex, 'selectedProfileCurrentIndex');
    	component_subscribe($$self, selectedProfileCurrentIndex, $$value => $$invalidate(12, $selectedProfileCurrentIndex = $$value));
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(3, $selectedProfile = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(13, $pageIndex = $$value));
    	validate_store(employeeCurrentIndex, 'employeeCurrentIndex');
    	component_subscribe($$self, employeeCurrentIndex, $$value => $$invalidate(14, $employeeCurrentIndex = $$value));
    	validate_store(studentCurrentIndex, 'studentCurrentIndex');
    	component_subscribe($$self, studentCurrentIndex, $$value => $$invalidate(15, $studentCurrentIndex = $$value));
    	validate_store(addToggle, 'addToggle');
    	component_subscribe($$self, addToggle, $$value => $$invalidate(16, $addToggle = $$value));
    	validate_store(subWindowStatus, 'subWindowStatus');
    	component_subscribe($$self, subWindowStatus, $$value => $$invalidate(17, $subWindowStatus = $$value));
    	validate_store(selectedProfileData, 'selectedProfileData');
    	component_subscribe($$self, selectedProfileData, $$value => $$invalidate(4, $selectedProfileData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Profile', slots, []);
    	const axios = require("axios").default;
    	let notYetDeleted = true, deleteAsk = false, historyAsk = false;

    	let editProfile = async () => {
    		set_store_value(subWindowStatus, $subWindowStatus = 10, $subWindowStatus);
    		set_store_value(addToggle, $addToggle = true, $addToggle);
    		$$invalidate(1, deleteAsk = false);
    		$$invalidate(2, historyAsk = false);
    	};

    	let deleteProfileAsk = () => {
    		$$invalidate(1, deleteAsk = true);
    		$$invalidate(2, historyAsk = false);
    	};

    	let deleteProfileCancel = () => {
    		$$invalidate(1, deleteAsk = false);
    	};

    	let deleteProfileProceed = async () => {
    		let url;

    		if ($pageIndex == 0) {
    			url = `http://localhost:14500/api/student/delete/${$selectedProfile._id}`;
    		} else {
    			url = `http://localhost:14500/api/employee/delete/${$selectedProfile._id}`;
    		}

    		let data = await axios.delete(url);

    		if (data.data.status == 1) {
    			set_store_value(studentCurrentIndex, $studentCurrentIndex = 1, $studentCurrentIndex);
    			set_store_value(employeeCurrentIndex, $employeeCurrentIndex = 1, $employeeCurrentIndex);
    			set_store_value(selectedProfile, $selectedProfile = "", $selectedProfile);
    		}
    	};

    	let deleteHistoryAsk = () => {
    		$$invalidate(2, historyAsk = true);
    		$$invalidate(1, deleteAsk = false);
    	};

    	let deleteHistoryCancel = () => {
    		$$invalidate(2, historyAsk = false);
    	};

    	let deleteHistory = async () => {
    		let url;

    		if ($pageIndex == 0) {
    			url = `http://localhost:14500/api/student/delete/${$selectedProfile._id}/history`;
    		} else {
    			url = `http://localhost:14500/api/employee/delete/${$selectedProfile._id}/history`;
    		}

    		let data = await axios.delete(url);

    		if (data.data.status == 1) {
    			set_store_value(selectedProfileCurrentIndex, $selectedProfileCurrentIndex = 1, $selectedProfileCurrentIndex);
    			$$invalidate(0, notYetDeleted = false);
    			$$invalidate(2, historyAsk = false);
    		}
    	};

    	onDestroy(() => {
    		$$invalidate(0, notYetDeleted = undefined);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		selectedProfile,
    		selectedProfileData,
    		selectedProfileCurrentIndex,
    		addToggle,
    		subWindowStatus,
    		pageIndex,
    		onDestroy,
    		fly,
    		fade,
    		studentCurrentIndex,
    		employeeCurrentIndex,
    		AttendanceCard,
    		axios,
    		notYetDeleted,
    		deleteAsk,
    		historyAsk,
    		editProfile,
    		deleteProfileAsk,
    		deleteProfileCancel,
    		deleteProfileProceed,
    		deleteHistoryAsk,
    		deleteHistoryCancel,
    		deleteHistory,
    		$selectedProfileCurrentIndex,
    		$selectedProfile,
    		$pageIndex,
    		$employeeCurrentIndex,
    		$studentCurrentIndex,
    		$addToggle,
    		$subWindowStatus,
    		$selectedProfileData
    	});

    	$$self.$inject_state = $$props => {
    		if ('notYetDeleted' in $$props) $$invalidate(0, notYetDeleted = $$props.notYetDeleted);
    		if ('deleteAsk' in $$props) $$invalidate(1, deleteAsk = $$props.deleteAsk);
    		if ('historyAsk' in $$props) $$invalidate(2, historyAsk = $$props.historyAsk);
    		if ('editProfile' in $$props) $$invalidate(5, editProfile = $$props.editProfile);
    		if ('deleteProfileAsk' in $$props) $$invalidate(6, deleteProfileAsk = $$props.deleteProfileAsk);
    		if ('deleteProfileCancel' in $$props) $$invalidate(7, deleteProfileCancel = $$props.deleteProfileCancel);
    		if ('deleteProfileProceed' in $$props) $$invalidate(8, deleteProfileProceed = $$props.deleteProfileProceed);
    		if ('deleteHistoryAsk' in $$props) $$invalidate(9, deleteHistoryAsk = $$props.deleteHistoryAsk);
    		if ('deleteHistoryCancel' in $$props) $$invalidate(10, deleteHistoryCancel = $$props.deleteHistoryCancel);
    		if ('deleteHistory' in $$props) $$invalidate(11, deleteHistory = $$props.deleteHistory);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		notYetDeleted,
    		deleteAsk,
    		historyAsk,
    		$selectedProfile,
    		$selectedProfileData,
    		editProfile,
    		deleteProfileAsk,
    		deleteProfileCancel,
    		deleteProfileProceed,
    		deleteHistoryAsk,
    		deleteHistoryCancel,
    		deleteHistory
    	];
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profile",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    // (18:0) {#if $loadingComplete}
    function create_if_block(ctx) {
    	let t0;
    	let t1;
    	let addbutton;
    	let t2;
    	let navigation;
    	let t3;
    	let main;
    	let sidebar_1;
    	let t4;
    	let div;
    	let header;
    	let t5;
    	let section;
    	let current_block_type_index;
    	let if_block2;
    	let current;
    	let if_block0 = /*$addToggle*/ ctx[1] == true && create_if_block_5(ctx);
    	let if_block1 = /*$sidebar*/ ctx[2] && create_if_block_4(ctx);
    	addbutton = new AddButton({ $$inline: true });
    	navigation = new Navigation({ $$inline: true });
    	sidebar_1 = new Sidebar({ $$inline: true });
    	header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$selectedProfile*/ ctx[3] != "") return 0;
    		if (/*$pageIndex*/ ctx[4] == 0) return 1;
    		if (/*$pageIndex*/ ctx[4] == 1) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			create_component(addbutton.$$.fragment);
    			t2 = space();
    			create_component(navigation.$$.fragment);
    			t3 = space();
    			main = element("main");
    			create_component(sidebar_1.$$.fragment);
    			t4 = space();
    			div = element("div");
    			create_component(header.$$.fragment);
    			t5 = space();
    			section = element("section");
    			if (if_block2) if_block2.c();
    			attr_dev(section, "class", "overflow-x-hidden w-full h-full overflow-scroll");
    			add_location(section, file, 30, 3, 986);
    			attr_dev(div, "class", "h-screen grid body svelte-wu42hr");
    			add_location(div, file, 28, 2, 936);
    			attr_dev(main, "class", "grid w-screen h-screen svelte-wu42hr");
    			add_location(main, file, 26, 1, 882);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(addbutton, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(navigation, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(sidebar_1, main, null);
    			append_dev(main, t4);
    			append_dev(main, div);
    			mount_component(header, div, null);
    			append_dev(div, t5);
    			append_dev(div, section);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$addToggle*/ ctx[1] == true) {
    				if (if_block0) {
    					if (dirty & /*$addToggle*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
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

    			if (/*$sidebar*/ ctx[2]) {
    				if (if_block1) {
    					if (dirty & /*$sidebar*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block2) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block2 = if_blocks[current_block_type_index];

    					if (!if_block2) {
    						if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block2.c();
    					}

    					transition_in(if_block2, 1);
    					if_block2.m(section, null);
    				} else {
    					if_block2 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(addbutton.$$.fragment, local);
    			transition_in(navigation.$$.fragment, local);
    			transition_in(sidebar_1.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(addbutton.$$.fragment, local);
    			transition_out(navigation.$$.fragment, local);
    			transition_out(sidebar_1.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(addbutton, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(navigation, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(main);
    			destroy_component(sidebar_1);
    			destroy_component(header);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:0) {#if $loadingComplete}",
    		ctx
    	});

    	return block;
    }

    // (19:1) {#if $addToggle == true}
    function create_if_block_5(ctx) {
    	let subwindow;
    	let current;
    	subwindow = new SubWindow({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(subwindow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subwindow, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subwindow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subwindow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subwindow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(19:1) {#if $addToggle == true}",
    		ctx
    	});

    	return block;
    }

    // (22:1) {#if $sidebar}
    function create_if_block_4(ctx) {
    	let sidemenu;
    	let current;
    	sidemenu = new SideMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sidemenu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidemenu, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidemenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidemenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidemenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(22:1) {#if $sidebar}",
    		ctx
    	});

    	return block;
    }

    // (36:30) 
    function create_if_block_3(ctx) {
    	let employee;
    	let current;
    	employee = new Employee({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(employee.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(employee, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(employee.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(employee.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(employee, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(36:30) ",
    		ctx
    	});

    	return block;
    }

    // (34:30) 
    function create_if_block_2(ctx) {
    	let student;
    	let current;
    	student = new Student({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(student.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(student, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(student.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(student.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(student, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(34:30) ",
    		ctx
    	});

    	return block;
    }

    // (32:4) {#if $selectedProfile != ""}
    function create_if_block_1(ctx) {
    	let profile;
    	let current;
    	profile = new Profile({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(profile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(profile, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(profile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(profile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(profile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(32:4) {#if $selectedProfile != \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let loadingscreen;
    	let t;
    	let if_block_anchor;
    	let current;
    	loadingscreen = new LoadingScreen({ $$inline: true });
    	let if_block = /*$loadingComplete*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			create_component(loadingscreen.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(loadingscreen, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$loadingComplete*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$loadingComplete*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingscreen.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loadingscreen.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loadingscreen, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
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
    	let $loadingComplete;
    	let $addToggle;
    	let $sidebar;
    	let $selectedProfile;
    	let $pageIndex;
    	validate_store(loadingComplete, 'loadingComplete');
    	component_subscribe($$self, loadingComplete, $$value => $$invalidate(0, $loadingComplete = $$value));
    	validate_store(addToggle, 'addToggle');
    	component_subscribe($$self, addToggle, $$value => $$invalidate(1, $addToggle = $$value));
    	validate_store(sidebar, 'sidebar');
    	component_subscribe($$self, sidebar, $$value => $$invalidate(2, $sidebar = $$value));
    	validate_store(selectedProfile, 'selectedProfile');
    	component_subscribe($$self, selectedProfile, $$value => $$invalidate(3, $selectedProfile = $$value));
    	validate_store(pageIndex, 'pageIndex');
    	component_subscribe($$self, pageIndex, $$value => $$invalidate(4, $pageIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Sidebar,
    		Header,
    		SideMenu,
    		AddButton,
    		Navigation,
    		LoadingScreen,
    		SubWindow,
    		Student,
    		Employee,
    		Profile,
    		pageIndex,
    		addToggle,
    		sidebar,
    		loadingComplete,
    		selectedProfile,
    		$loadingComplete,
    		$addToggle,
    		$sidebar,
    		$selectedProfile,
    		$pageIndex
    	});

    	return [$loadingComplete, $addToggle, $sidebar, $selectedProfile, $pageIndex];
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
