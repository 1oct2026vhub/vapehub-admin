import { memo } from 'react';

/**
 * DemoContent is a React component used to render a demo content on the page.
 * It renders a image on the page followed by a heading, some text and a footer.
 * It also renders a quote and some content about a person being transformed into a vermin.
 */
function DemoContent() {
	return (
		<div>
			<img
				src="/assets/images/demo-content/morain-lake.jpg"
				alt="beach"
				style={{
					maxWidth: '640px',
					width: '100%'
				}}
				className="rounded-md"
			/>
			<h1 className="py-4 font-semibold">Early Sunrise</h1>
			<h4 className="pb-3 font-medium">Demo Content</h4>
			<p>
				One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a
				horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his
				brown belly, slightly domed and divided by arches into stiff sections.
			</p>
			<blockquote>
				<p>
					The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs,
					pitifully thin compared with the size of the rest of him, waved about helplessly as he looked.
					"What's happened to me? " he thought. It wasn't a dream.
				</p>
				<footer>John Doe</footer>
			</blockquote>
			<p>
				"Getting up early all the time", he thought, "it makes you stupid. You've got to get enough sleep. Other
				travelling salesmen live a life of luxury. For instance, whenever I go back to the guest house during
				the morning to copy out the contract, these gentlemen are always still sitting there eating their
				breakfasts. I ought to just try that with my boss; I'd get kicked out on the spot. But who knows, maybe
				that would be the best thing for me...
			</p>
		</div>
	);
}

export default memo(DemoContent);
