import UrlRewriter from '../UrlRewriter';

/**
 * Набор методов для работы с router.json, в котором можно задать соответствие
 * между текущим путем и его короткой записью - "красивым" URL
 * @see Router/router:IUrlRewriter
 * @private
 * @deprecated
 */
const UrlRewriterInstance = UrlRewriter.getInstance();
export default UrlRewriterInstance;
